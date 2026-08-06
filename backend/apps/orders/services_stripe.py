"""
Thin wrapper around Stripe Checkout Sessions.

Docs: https://stripe.com/docs/api/checkout/sessions

Note: like services.py (Paystack) and services_flutterwave.py, this has not
been exercised against Stripe's live servers in the environment this project
was built in — outbound network there is restricted to a fixed allowlist
that doesn't include api.stripe.com. The request/response shapes below
follow the official `stripe` Python SDK (v15) exactly, but test this against
a real Stripe test secret key before relying on it in production.
"""

from decimal import Decimal

import stripe
from django.conf import settings

# Stripe does support NGN as a presentment currency for Checkout, so orders
# stay in Naira end-to-end rather than converting to USD at checkout.
CURRENCY = "ngn"


class StripeError(Exception):
    def __init__(self, message: str, data: dict | None = None):
        super().__init__(message)
        self.data = data or {}


def _configure() -> None:
    if not settings.STRIPE_SECRET_KEY:
        raise StripeError("STRIPE_SECRET_KEY is not configured on the server.")
    stripe.api_key = settings.STRIPE_SECRET_KEY


def to_subunit(naira_amount: Decimal) -> int:
    """Stripe expects amounts in the smallest currency unit — kobo for NGN,
    same convention as Paystack."""
    return int(naira_amount * 100)


def create_checkout_session(
    *, email: str, full_name: str, amount: Decimal, order_number: str, success_url: str, cancel_url: str
) -> dict:
    """Starts a Stripe Checkout Session and returns the hosted payment page
    URL.

    `success_url` should contain the literal `{CHECKOUT_SESSION_ID}`
    placeholder — Stripe substitutes it with the real session id on redirect,
    which becomes our `payment_reference` for verification, mirroring how
    Paystack's `reference` and Flutterwave's `tx_ref` are used elsewhere in
    this app.
    """
    _configure()
    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            customer_email=email,
            client_reference_id=order_number,
            line_items=[
                {
                    "price_data": {
                        "currency": CURRENCY,
                        "unit_amount": to_subunit(amount),
                        "product_data": {"name": f"Sophisticat Order {order_number}"},
                    },
                    "quantity": 1,
                }
            ],
            metadata={"order_number": order_number},
            success_url=success_url,
            cancel_url=cancel_url,
        )
    except stripe.error.StripeError as exc:
        raise StripeError(str(exc)) from exc
    return {"id": session.id, "url": session.url}


def retrieve_session(session_id: str) -> stripe.checkout.Session:
    """Confirms a Checkout Session's payment status directly with Stripe
    (source of truth, used both by the callback flow and the webhook
    handler)."""
    _configure()
    try:
        return stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as exc:
        raise StripeError(str(exc)) from exc


def construct_webhook_event(payload: bytes, sig_header: str) -> stripe.Event:
    """Verifies and parses a Stripe webhook payload using the endpoint's
    signing secret (STRIPE_WEBHOOK_SECRET, from the dashboard under
    Developers > Webhooks)."""
    if not settings.STRIPE_WEBHOOK_SECRET:
        raise StripeError("STRIPE_WEBHOOK_SECRET is not configured on the server.")
    try:
        return stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise StripeError(f"Invalid Stripe webhook payload: {exc}") from exc
