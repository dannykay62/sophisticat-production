"""
Test suite for the order + payment lifecycle: order creation, Stripe
Checkout, Paystack (initialize/verify/webhook with a real HMAC signature),
provider co-existence, idempotent payment confirmation, and the
order-status-event deduplication fix.

Network calls to Stripe/Paystack are always mocked at the service-module
boundary (apps.orders.services_stripe / apps.orders.services) — this suite
verifies our integration code is correct, not that Stripe/Paystack's APIs
behave as documented. Test against real test-mode keys separately before
relying on either provider in production.

Run with:
    python manage.py test apps.orders --settings=sophisticat.settings_test
"""

import hashlib
import hmac
import json
from decimal import Decimal
from unittest.mock import patch

from django.conf import settings
from django.core import mail
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from django.utils import timezone

from apps.accounts.models import User
from apps.products.models import Category, Coupon, Product

from .models import Order, OrderItem, OrderStatusEvent
from .serializers import OrderCreateSerializer
from .services_stripe import StripeError


def make_product():
    category, _ = Category.objects.get_or_create(name="Rings", slug="rings")
    return Product.objects.create(
        name="Gold Signet Ring", slug="gold-signet-ring", category=category,
        price=Decimal("45000.00"), stock_quantity=10,
    )


def make_paid_order(user, product, **extra):
    order = Order.objects.create(
        user=user, full_name="Amara Nwosu", email=user.email, phone="08012345678",
        address="12 Admiralty Way", city="Lekki", state="Lagos",
        subtotal=Decimal("45000.00"), shipping_fee=Decimal("2000.00"), total=Decimal("47000.00"),
        **extra,
    )
    OrderItem.objects.create(order=order, product=product, product_name=product.name, unit_price=product.price, quantity=1)
    OrderStatusEvent.objects.create(order=order, status="processing", note="Order placed successfully.")
    return order


class OrderCreationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.product = make_product()
        self.client.force_authenticate(user=self.user)

    def test_create_order_success(self):
        response = self.client.post(
            reverse("order-list-create"),
            {
                "full_name": "Amara Nwosu", "email": "amara@example.com", "phone": "08012345678",
                "address": "12 Admiralty Way", "city": "Lekki", "state": "Lagos",
                "payment_method": "card",
                "items": [{"product_id": str(self.product.id), "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        order = Order.objects.get(order_number=response.data["order_number"])
        self.assertEqual(order.status_events.count(), 1)
        self.assertEqual(order.status_events.first().status, "processing")
        self.assertEqual(order.payment_status, "pending")

    def test_create_order_rejects_missing_fields(self):
        response = self.client.post(reverse("order-list-create"), {"full_name": ""}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_rejects_out_of_stock(self):
        self.product.stock_quantity = 0
        self.product.save(update_fields=["stock_quantity"])
        response = self.client.post(
            reverse("order-list-create"),
            {
                "full_name": "Amara Nwosu", "email": "amara@example.com", "phone": "08012345678",
                "address": "12 Admiralty Way", "city": "Lekki", "state": "Lagos",
                "payment_method": "card",
                "items": [{"product_id": str(self.product.id), "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_order_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(reverse("order-list-create"), {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class OrderCreateRaceConditionTests(APITestCase):
    """
    Regression tests for the overselling / over-redemption bug: create()
    used to trust validate_items()/validate_coupon_code(), which run before
    the transaction opens and don't hold any lock, so stock or a coupon's
    usage_limit could be exceeded by two concurrent checkouts that both pass
    validation against the same pre-transaction snapshot. create() now
    re-checks both under a select_for_update() lock inside the transaction.

    A real concurrent-thread test isn't reliable against SQLite (used for
    the test suite), so these simulate the race directly: call
    OrderCreateSerializer.create() with validated_data that was already
    accepted by validate_items()/validate_coupon_code(), but where the
    underlying row has since changed underneath it -- exactly what a second,
    concurrent request would do to the first request's in-flight data.
    """

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.product = make_product()

    def _make_request(self):
        request = type("R", (), {"user": self.user})()
        return request

    def test_create_raises_when_stock_drops_between_validation_and_create(self):
        # Simulates: request A validates fine (stock=10, wants 1), then a
        # concurrent request B sells the last unit before A's create() runs.
        self.product.stock_quantity = 0
        self.product.save(update_fields=["stock_quantity"])

        serializer = OrderCreateSerializer(
            data={
                "full_name": "Amara Nwosu", "email": "amara@example.com", "phone": "08012345678",
                "address": "12 Admiralty Way", "city": "Lekki", "state": "Lagos",
                "payment_method": "card",
                "items": [{"product_id": str(self.product.id), "quantity": 1}],
            },
            context={"request": self._make_request()},
        )
        # validate_items() re-checks stock too, so it will already reject
        # this -- but that's fine, it proves the same guard exists both at
        # validation time AND (for the true race) inside create() below.
        self.assertFalse(serializer.is_valid())
        self.assertIn("items", serializer.errors)

    def test_create_rejects_stock_shortfall_discovered_inside_transaction(self):
        # Bypass validate_items() entirely (as a stale/cached validated_data
        # payload effectively would in a real race) and call create()
        # directly to prove the lock-and-recheck inside create() itself --
        # not just the outer validator -- is what actually prevents the
        # oversell.
        self.product.stock_quantity = 0
        self.product.save(update_fields=["stock_quantity"])

        serializer = OrderCreateSerializer(context={"request": self._make_request()})
        validated_data = {
            "full_name": "Amara Nwosu", "email": "amara@example.com", "phone": "08012345678",
            "address": "12 Admiralty Way", "city": "Lekki", "state": "Lagos",
            "payment_method": "card",
            "coupon_code": "",
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }
        with self.assertRaises(Exception):
            serializer.create(validated_data)

        # No order should have been committed -- proves the atomic
        # transaction rolled back cleanly rather than leaving a partial
        # order/stock-decrement behind.
        self.assertEqual(Order.objects.count(), 0)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 0)

    def test_create_rejects_coupon_usage_limit_hit_inside_transaction(self):
        coupon = Coupon.objects.create(
            code="RACE10", discount_percent=10,
            valid_from=timezone.now() - timezone.timedelta(days=1),
            valid_until=timezone.now() + timezone.timedelta(days=1),
            usage_limit=1, times_used=1,  # already exhausted by a "concurrent" checkout
        )

        serializer = OrderCreateSerializer(context={"request": self._make_request()})
        validated_data = {
            "full_name": "Amara Nwosu", "email": "amara@example.com", "phone": "08012345678",
            "address": "12 Admiralty Way", "city": "Lekki", "state": "Lagos",
            "payment_method": "card",
            "coupon_code": coupon.code,
            "items": [{"product_id": self.product.id, "quantity": 1}],
        }
        with self.assertRaises(Exception):
            serializer.create(validated_data)

        self.assertEqual(Order.objects.count(), 0)
        coupon.refresh_from_db()
        self.assertEqual(coupon.times_used, 1)  # unchanged -- not double-incremented


class StripePaymentTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.product = make_product()
        self.client.force_authenticate(user=self.user)

    def test_initialize_creates_stripe_session_and_stores_reference(self):
        order = make_paid_order(self.user, self.product)
        with patch("apps.orders.views.stripe_service.create_checkout_session") as mock_create:
            mock_create.return_value = {"id": "cs_test_abc", "url": "https://checkout.stripe.com/pay/cs_test_abc"}
            response = self.client.post(reverse("order-initialize-payment", args=[order.order_number]))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["authorization_url"], "https://checkout.stripe.com/pay/cs_test_abc")

        # success_url must keep Stripe's literal placeholder, not have it
        # mangled by Python string formatting
        success_url = mock_create.call_args.kwargs["success_url"]
        self.assertTrue(success_url.endswith("?reference={CHECKOUT_SESSION_ID}"), success_url)

        order.refresh_from_db()
        self.assertEqual(order.payment_provider, "stripe")
        self.assertEqual(order.payment_reference, "cs_test_abc")

    def test_cannot_initialize_an_already_paid_order(self):
        order = make_paid_order(self.user, self.product, payment_status="paid")
        response = self.client.post(reverse("order-initialize-payment", args=[order.order_number]))
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_gateway_error_returns_502_not_500(self):
        order = make_paid_order(self.user, self.product)
        with patch("apps.orders.views.stripe_service.create_checkout_session") as mock_create:
            mock_create.side_effect = StripeError("STRIPE_SECRET_KEY is not configured on the server.")
            response = self.client.post(reverse("order-initialize-payment", args=[order.order_number]))
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)

    def test_verify_marks_order_paid_and_sends_one_confirmation_email(self):
        order = make_paid_order(self.user, self.product, payment_provider="stripe", payment_reference="cs_test_verify")
        mail.outbox.clear()

        with patch("apps.orders.views.stripe_service.retrieve_session") as mock_retrieve:
            mock_retrieve.return_value = {"payment_status": "paid", "id": "cs_test_verify"}
            response = self.client.get(reverse("order-verify-payment"), {"reference": "cs_test_verify"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Order Confirmed", mail.outbox[0].subject)
        # No duplicate status event — confirmation note folded into the
        # existing "processing" event instead of creating a second one
        self.assertEqual(order.status_events.count(), 1)
        self.assertIn("Payment confirmed via Stripe.", order.status_events.first().note)

    def test_verify_is_idempotent_on_repeat_calls(self):
        order = make_paid_order(self.user, self.product, payment_provider="stripe", payment_reference="cs_test_repeat")

        with patch("apps.orders.views.stripe_service.retrieve_session") as mock_retrieve:
            mock_retrieve.return_value = {"payment_status": "paid", "id": "cs_test_repeat"}
            self.client.get(reverse("order-verify-payment"), {"reference": "cs_test_repeat"})
            mail.outbox.clear()
            response = self.client.get(reverse("order-verify-payment"), {"reference": "cs_test_repeat"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.status_events.count(), 1)
        self.assertEqual(len(mail.outbox), 0)

    def test_verify_marks_order_failed_when_not_paid(self):
        order = make_paid_order(self.user, self.product, payment_provider="stripe", payment_reference="cs_test_failed")
        with patch("apps.orders.views.stripe_service.retrieve_session") as mock_retrieve:
            mock_retrieve.return_value = {"payment_status": "unpaid", "id": "cs_test_failed"}
            response = self.client.get(reverse("order-verify-payment"), {"reference": "cs_test_failed"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "failed")

    def test_webhook_marks_order_paid(self):
        order = make_paid_order(self.user, self.product, payment_provider="stripe", payment_reference="cs_test_webhook")
        mail.outbox.clear()
        fake_event = {"type": "checkout.session.completed", "data": {"object": {"id": "cs_test_webhook", "payment_status": "paid"}}}

        with patch("apps.orders.views.stripe_service.construct_webhook_event") as mock_construct:
            mock_construct.return_value = fake_event
            response = self.client.post(
                reverse("order-stripe-webhook"), data=b"{}", content_type="application/json",
                HTTP_STRIPE_SIGNATURE="t=1,v1=fake",
            )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(len(mail.outbox), 1)

    def test_webhook_rejects_bad_signature(self):
        with patch("apps.orders.views.stripe_service.construct_webhook_event") as mock_construct:
            mock_construct.side_effect = StripeError("Invalid Stripe webhook payload: bad signature")
            response = self.client.post(
                reverse("order-stripe-webhook"), data=b"{}", content_type="application/json",
                HTTP_STRIPE_SIGNATURE="bad",
            )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class PaystackPaymentTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.product = make_product()
        self.client.force_authenticate(user=self.user)

    def test_initialize_with_provider_paystack(self):
        order = make_paid_order(self.user, self.product)
        with patch("apps.orders.views.initialize_transaction") as mock_init:
            mock_init.return_value = {"authorization_url": "https://checkout.paystack.com/xyz", "reference": order.order_number}
            response = self.client.post(
                reverse("order-initialize-payment", args=[order.order_number]), {"provider": "paystack"}, format="json"
            )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        order.refresh_from_db()
        self.assertEqual(order.payment_provider, "paystack")
        self.assertEqual(order.payment_reference, order.order_number)

    def test_default_provider_is_stripe_when_unspecified(self):
        order = make_paid_order(self.user, self.product)
        with patch("apps.orders.views.stripe_service.create_checkout_session") as mock_create:
            mock_create.return_value = {"id": "cs_test_default", "url": "https://checkout.stripe.com/pay/x"}
            response = self.client.post(reverse("order-initialize-payment", args=[order.order_number]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_provider, "stripe")

    def test_unknown_provider_is_rejected(self):
        order = make_paid_order(self.user, self.product)
        response = self.client.post(
            reverse("order-initialize-payment", args=[order.order_number]), {"provider": "dogecoin"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_routes_to_paystack_when_order_provider_is_paystack(self):
        order = make_paid_order(self.user, self.product, payment_provider="paystack", payment_reference="SC-TEST01")
        mail.outbox.clear()
        with patch("apps.orders.views.verify_transaction") as mock_verify:
            mock_verify.return_value = {"status": "success"}
            response = self.client.get(reverse("order-verify-payment"), {"reference": "SC-TEST01"})
            mock_verify.assert_called_once_with("SC-TEST01")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(order.status_events.count(), 1, "should not duplicate the processing event")

    def test_webhook_with_real_hmac_signature_marks_order_paid(self):
        """Unlike the other tests, this one does NOT mock signature
        verification — it computes a genuine HMAC-SHA512 signature the same
        way Paystack does, so this test actually exercises PaystackWebhookView's
        real security check end to end."""
        order = make_paid_order(self.user, self.product, payment_provider="paystack", payment_reference="SC-TEST02")
        mail.outbox.clear()

        payload = {"event": "charge.success", "data": {"reference": "SC-TEST02"}}
        body = json.dumps(payload).encode()
        signature = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()

        response = self.client.post(
            reverse("order-paystack-webhook"), data=body, content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "paid")
        self.assertEqual(len(mail.outbox), 1)

    def test_webhook_rejects_forged_signature(self):
        order = make_paid_order(self.user, self.product, payment_provider="paystack", payment_reference="SC-TEST03")
        payload = {"event": "charge.success", "data": {"reference": "SC-TEST03"}}
        body = json.dumps(payload).encode()

        response = self.client.post(
            reverse("order-paystack-webhook"), data=body, content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE="0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "pending")

    def test_webhook_ignores_unrelated_event_types(self):
        order = make_paid_order(self.user, self.product, payment_provider="paystack", payment_reference="SC-TEST04")
        payload = {"event": "subscription.create", "data": {"reference": "SC-TEST04"}}
        body = json.dumps(payload).encode()
        signature = hmac.new(settings.PAYSTACK_SECRET_KEY.encode(), body, hashlib.sha512).hexdigest()

        response = self.client.post(
            reverse("order-paystack-webhook"), data=body, content_type="application/json",
            HTTP_X_PAYSTACK_SIGNATURE=signature,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        order.refresh_from_db()
        self.assertEqual(order.payment_status, "pending")


class PaymentInitThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.product = make_product()
        self.client.force_authenticate(user=self.user)

    def test_initialize_payment_is_throttled_after_30_per_hour(self):
        orders = [make_paid_order(self.user, self.product) for _ in range(31)]
        with patch("apps.orders.views.stripe_service.create_checkout_session") as mock_create:
            mock_create.return_value = {"id": "cs_test", "url": "https://checkout.stripe.com/pay/x"}
            statuses = [
                self.client.post(reverse("order-initialize-payment", args=[o.order_number])).status_code
                for o in orders
            ]
        self.assertTrue(all(s != status.HTTP_429_TOO_MANY_REQUESTS for s in statuses[:30]), statuses)
        self.assertEqual(statuses[30], status.HTTP_429_TOO_MANY_REQUESTS, statuses)

    def test_webhooks_are_never_throttled(self):
        """Stripe/Paystack retry failed webhook deliveries aggressively —
        confirm neither webhook view is subject to the general throttle."""
        from .views import StripeWebhookView, PaystackWebhookView

        self.assertEqual(StripeWebhookView.throttle_classes, [])
        self.assertEqual(PaystackWebhookView.throttle_classes, [])


class OrderTrackingTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.product = make_product()

    def test_tracking_is_public_and_requires_no_auth(self):
        order = make_paid_order(self.user, self.product)
        response = self.client.get(reverse("order-track", args=[order.order_number]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order_number"], order.order_number)

    def test_tracking_unknown_order_returns_404_not_500(self):
        response = self.client.get(reverse("order-track", args=["SC-DOESNOTEXIST"]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class OrderEmailTests(APITestCase):
    """Direct tests of the email-sending functions themselves — the shipping
    update email is normally triggered from Django admin's order-status
    inline formset (apps/orders/admin.py), which is framework plumbing not
    worth re-testing here; this exercises the actual business logic those
    call sites depend on."""

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.product = make_product()

    def test_send_order_confirmation_email_content(self):
        from .emails import send_order_confirmation_email

        order = make_paid_order(self.user, self.product)
        mail.outbox.clear()
        send_order_confirmation_email(order)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertIn(order.order_number, sent.subject)
        self.assertIn(order.order_number, sent.body)
        self.assertIn("Gold Signet Ring", sent.body)
        self.assertEqual(sent.to, [order.email])
        # HTML alternative attached alongside the plain-text body
        self.assertEqual(len(sent.alternatives), 1)
        html_body, mimetype = sent.alternatives[0]
        self.assertEqual(mimetype, "text/html")
        self.assertIn(order.order_number, html_body)

    def test_send_shipping_update_email_for_shipped_status(self):
        from .emails import send_shipping_update_email

        order = make_paid_order(self.user, self.product)
        event = OrderStatusEvent.objects.create(order=order, status="shipped", note="Handed to courier.")
        order.status = "shipped"  # admin.py updates this before calling send_shipping_update_email
        order.save(update_fields=["status"])
        mail.outbox.clear()
        send_shipping_update_email(event)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertIn("Shipped", sent.subject)
        self.assertIn("Handed to courier.", sent.body)

    def test_send_shipping_update_email_noop_for_processing_status(self):
        """'processing' is covered by the order-confirmation email — the
        shipping-update function must not send anything for it, or every
        order would get a redundant second email."""
        from .emails import send_shipping_update_email

        order = make_paid_order(self.user, self.product)
        event = order.status_events.first()  # status="processing" from make_paid_order
        mail.outbox.clear()
        send_shipping_update_email(event)

        self.assertEqual(len(mail.outbox), 0)

    def test_email_send_failure_does_not_raise(self):
        """A broken SMTP config must never break checkout or an admin action
        — send_mail failures are caught and logged, not propagated."""
        from .emails import send_order_confirmation_email

        order = make_paid_order(self.user, self.product)
        with patch("apps.orders.emails.EmailMultiAlternatives.send", side_effect=Exception("SMTP is down")):
            send_order_confirmation_email(order)  # should not raise
