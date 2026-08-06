"""
Thin wrapper around Paystack's REST API.

Docs: https://paystack.com/docs/api/transaction/

Note: this talks to https://api.paystack.co over HTTPS using `requests`.
It has not been exercised against Paystack's live servers in the environment
this project was built in (outbound network there is restricted to a fixed
allowlist that doesn't include api.paystack.co) — the request/response
shapes below follow Paystack's documented API exactly, but test this against
a real Paystack test secret key before relying on it in production.
"""

from decimal import Decimal

import requests
from django.conf import settings

PAYSTACK_BASE_URL = "https://api.paystack.co"


class PaystackError(Exception):
    def __init__(self, message: str, data: dict | None = None):
        super().__init__(message)
        self.data = data or {}


def _headers() -> dict:
    if not settings.PAYSTACK_SECRET_KEY:
        raise PaystackError("PAYSTACK_SECRET_KEY is not configured on the server.")
    return {
        "Authorization": f"Bearer {settings.PAYSTACK_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def to_kobo(naira_amount: Decimal) -> int:
    """Paystack expects amounts in the smallest currency unit (kobo)."""
    return int(naira_amount * 100)


def initialize_transaction(*, email: str, amount: Decimal, reference: str, callback_url: str) -> dict:
    """Starts a Paystack transaction and returns the hosted payment page URL.

    Returns Paystack's `data` object: {authorization_url, access_code, reference}
    """
    payload = {
        "email": email,
        "amount": to_kobo(amount),
        "reference": reference,
        "callback_url": callback_url,
        "currency": "NGN",
    }
    try:
        response = requests.post(
            f"{PAYSTACK_BASE_URL}/transaction/initialize",
            json=payload,
            headers=_headers(),
            timeout=15,
        )
    except requests.RequestException as exc:
        raise PaystackError(f"Could not reach Paystack: {exc}") from exc

    body = response.json()
    if not response.ok or not body.get("status"):
        raise PaystackError(body.get("message", "Paystack initialization failed."), data=body)
    return body["data"]


def verify_transaction(reference: str) -> dict:
    """Confirms a transaction's status directly with Paystack (source of truth,
    used both by the callback flow and the webhook handler)."""
    try:
        response = requests.get(
            f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}",
            headers=_headers(),
            timeout=15,
        )
    except requests.RequestException as exc:
        raise PaystackError(f"Could not reach Paystack: {exc}") from exc

    body = response.json()
    if not response.ok or not body.get("status"):
        raise PaystackError(body.get("message", "Paystack verification failed."), data=body)
    return body["data"]
