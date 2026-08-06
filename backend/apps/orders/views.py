import hashlib
import hmac
import logging

from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from . import services_stripe as stripe_service
from .emails import send_order_confirmation_email
from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer
from .services import PaystackError, initialize_transaction, verify_transaction

logger = logging.getLogger(__name__)

# Flutterwave is fully implemented but disabled — see the commented-out
# FlutterwaveWebhookView below. Uncomment this import alongside it, and the
# flutterwave branches in InitializePaymentView / VerifyPaymentView, to
# switch it back on.
# from . import services_flutterwave as flutterwave


def _mark_order_paid(order: Order, note: str) -> None:
    """Shared by the callback-verify flow and both provider webhooks — all
    three call sites already guard on `payment_status != "paid"` before
    calling this, so the email only ever fires once per order.

    Doesn't create a new OrderStatusEvent: the order's `status` itself
    doesn't change here (it's already "processing" from OrderCreateSerializer
    at order-placement time), so a second "processing" timeline entry would
    just be duplicate noise in the admin's order history. Instead, the
    confirmation detail (which provider, webhook vs. browser callback) gets
    folded into the existing first event's note for anyone auditing later.
    """
    order.payment_status = "paid"
    order.save(update_fields=["payment_status"])
    first_event = order.status_events.order_by("created_at").first()
    if first_event and first_event.status == "processing":
        first_event.note = f"{first_event.note} {note}".strip()
        first_event.save(update_fields=["note"])
    send_order_confirmation_email(order)


class OrderListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items", "status_events")

    def get_serializer_class(self):
        return OrderCreateSerializer if self.request.method == "POST" else OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={"request": request})

        if not serializer.is_valid():
            logger.warning("Order validation failed for user %s: %s", request.user.id, serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order = serializer.save()
        return Response(
            OrderSerializer(order, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_number"

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class OrderTrackingView(APIView):
    """Public order tracking by order number — no auth required, matching
    the storefront's guest-friendly tracking page."""

    permission_classes = [permissions.AllowAny]

    def get(self, request, order_number):
        try:
            order = Order.objects.get(order_number__iexact=order_number)
        except Order.DoesNotExist:
            return Response({"detail": "No order found with that number."}, status=404)
        return Response(OrderSerializer(order, context={"request": request}).data)


class InitializePaymentView(APIView):
    """Starts a payment transaction for an existing order and returns the
    hosted payment page URL for the frontend to redirect the customer to.

    Accepts an optional `provider` field in the request body — "stripe"
    (default) or "paystack" — so the frontend's payment method picker can
    route to either gateway. Flutterwave is still fully implemented
    (services_flutterwave.py) but disabled here; its branch is commented
    out below alongside the disabled webhook view.
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment-init"

    def post(self, request, order_number):
        order = Order.objects.filter(order_number__iexact=order_number, user=request.user).first()
        if not order:
            return Response({"detail": "Order not found."}, status=status.HTTP_404_NOT_FOUND)
        if order.payment_status == "paid":
            return Response({"detail": "This order has already been paid for."}, status=status.HTTP_400_BAD_REQUEST)

        provider = request.data.get("provider", "stripe")
        if provider not in ("stripe", "paystack"):
            return Response({"detail": "Unknown payment provider."}, status=status.HTTP_400_BAD_REQUEST)

        callback_url = f"{settings.FRONTEND_URL}/checkout/callback"

        if provider == "paystack":
            try:
                data = initialize_transaction(
                    email=order.email,
                    amount=order.total,
                    reference=order.order_number,
                    callback_url=callback_url,
                )
            except PaystackError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

            order.payment_provider = "paystack"
            order.payment_reference = data["reference"]
            order.save(update_fields=["payment_provider", "payment_reference"])
            return Response({"authorization_url": data["authorization_url"], "reference": data["reference"]})

        # Stripe
        try:
            data = stripe_service.create_checkout_session(
                email=order.email,
                full_name=order.full_name,
                amount=order.total,
                order_number=order.order_number,
                # Stripe substitutes this placeholder with the real session
                # id on redirect; VerifyPaymentView reads it as `reference`,
                # same shape as the Paystack flow above.
                success_url=f"{callback_url}?reference={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.FRONTEND_URL}/checkout",
            )
        except stripe_service.StripeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        order.payment_provider = "stripe"
        order.payment_reference = data["id"]
        order.save(update_fields=["payment_provider", "payment_reference"])
        return Response({"authorization_url": data["url"], "reference": data["id"]})

        # -- Flutterwave (disabled — kept for future use) ------------------
        # if provider == "flutterwave":
        #     try:
        #         data = flutterwave.initialize_payment(
        #             email=order.email,
        #             full_name=order.full_name,
        #             amount=order.total,
        #             tx_ref=order.order_number,
        #             redirect_url=callback_url,
        #         )
        #     except flutterwave.FlutterwaveError as exc:
        #         return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        #
        #     order.payment_provider = "flutterwave"
        #     order.payment_reference = order.order_number  # Flutterwave verifies by our tx_ref, not a gateway-issued id
        #     order.save(update_fields=["payment_provider", "payment_reference"])
        #     return Response({"authorization_url": data["link"], "reference": order.order_number})


class VerifyPaymentView(APIView):
    """Called by the frontend's /checkout/callback page after the gateway
    redirects the customer back — confirms payment status directly with
    whichever provider the order was initialized against (each webhook is
    still the durable source of truth for production; this gives the
    customer an immediate answer)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "payment-init"

    def get(self, request):
        reference = request.query_params.get("reference")
        if not reference:
            return Response({"detail": "Missing reference."}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.filter(payment_reference=reference).first()
        if not order:
            return Response({"detail": "No order found for that payment reference."}, status=status.HTTP_404_NOT_FOUND)

        if order.payment_provider == "paystack":
            try:
                data = verify_transaction(reference)
            except PaystackError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
            succeeded = data.get("status") == "success"
            note = "Payment confirmed via Paystack."
        else:
            try:
                session = stripe_service.retrieve_session(reference)
            except stripe_service.StripeError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
            succeeded = session.get("payment_status") == "paid"
            note = "Payment confirmed via Stripe."

        # -- Flutterwave (disabled — kept for future use) ------------------
        # if order.payment_provider == "flutterwave":
        #     try:
        #         data = flutterwave.verify_payment_by_reference(reference)
        #     except flutterwave.FlutterwaveError as exc:
        #         return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        #     succeeded = data.get("status") == "successful"
        #     note = "Payment confirmed via Flutterwave."

        if succeeded and order.payment_status != "paid":
            _mark_order_paid(order, note)
        elif not succeeded:
            order.payment_status = "failed"
            order.save(update_fields=["payment_status"])

        return Response(OrderSerializer(order, context={"request": request}).data)


class StripeWebhookView(APIView):
    """Stripe's server-to-server webhook — the durable source of truth for
    payment status, independent of whether the customer's browser makes it
    back to /checkout/callback. Verifies the `Stripe-Signature` header using
    STRIPE_WEBHOOK_SECRET (from the dashboard under Developers > Webhooks)
    before trusting the payload."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    # Explicitly no throttling: Stripe retries failed webhook deliveries
    # aggressively, and this endpoint is protected by signature
    # verification, not rate limiting.
    throttle_classes = []

    def post(self, request):
        sig_header = request.headers.get("Stripe-Signature", "")
        try:
            event = stripe_service.construct_webhook_event(request.body, sig_header)
        except stripe_service.StripeError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_401_UNAUTHORIZED)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            if session.get("payment_status") == "paid":
                order = Order.objects.filter(payment_reference=session.get("id")).first()
                if order and order.payment_status != "paid":
                    _mark_order_paid(order, "Payment confirmed via Stripe webhook.")

        return Response({"received": True})


class PaystackWebhookView(APIView):
    """Paystack's server-to-server webhook — the durable source of truth for
    payment status, independent of whether the customer's browser makes it
    back to /checkout/callback. Verifies the `x-paystack-signature` header
    per Paystack's documented HMAC-SHA512 scheme before trusting the payload."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    # Explicitly no throttling: Paystack retries failed webhook deliveries
    # aggressively, and this endpoint is protected by signature
    # verification, not rate limiting.
    throttle_classes = []

    def post(self, request):
        signature = request.headers.get("x-paystack-signature", "")
        secret = settings.PAYSTACK_SECRET_KEY.encode()
        expected = hmac.new(secret, request.body, hashlib.sha512).hexdigest()

        if not secret or not hmac.compare_digest(signature, expected):
            return Response({"detail": "Invalid signature."}, status=status.HTTP_401_UNAUTHORIZED)

        event = request.data.get("event")
        data = request.data.get("data", {})
        reference = data.get("reference")

        if event == "charge.success" and reference:
            order = Order.objects.filter(payment_reference=reference).first()
            if order and order.payment_status != "paid":
                _mark_order_paid(order, "Payment confirmed via Paystack webhook.")

        return Response({"received": True})


# -- Flutterwave webhook (disabled — kept for future use) -----------------
#
# class FlutterwaveWebhookView(APIView):
#     """Flutterwave's server-to-server webhook. Flutterwave doesn't sign the
#     payload with an HMAC like Paystack — instead it echoes back a shared
#     secret (set in the dashboard under Settings > Webhooks) in the
#     `verif-hash` header, which we compare against FLUTTERWAVE_SECRET_HASH."""
#
#     permission_classes = [permissions.AllowAny]
#     authentication_classes = []
#
#     def post(self, request):
#         received_hash = request.headers.get("verif-hash", "")
#         expected_hash = settings.FLUTTERWAVE_SECRET_HASH
#
#         if not expected_hash or not hmac.compare_digest(received_hash, expected_hash):
#             return Response({"detail": "Invalid signature."}, status=status.HTTP_401_UNAUTHORIZED)
#
#         data = request.data.get("data", {})
#         event_status = data.get("status")
#         tx_ref = data.get("tx_ref")
#
#         if event_status == "successful" and tx_ref:
#             order = Order.objects.filter(payment_reference=tx_ref, payment_provider="flutterwave").first()
#             if order and order.payment_status != "paid":
#                 _mark_order_paid(order, "Payment confirmed via Flutterwave webhook.")
#
#         return Response({"received": True})
