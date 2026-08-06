"""
Thin wrapper around Flutterwave's REST API (v3, Standard payment flow).

Docs: https://developer.flutterwave.com/docs/getting-started

Note: like services.py (Paystack), this has not been exercised against
Flutterwave's live servers in the environment this project was built in —
outbound network there is restricted to a fixed allowlist that doesn't
include api.flutterwave.com. The request/response shapes below follow
Flutterwave's documented API exactly, but test this against a real
Flutterwave test secret key before relying on it in production.
"""

from decimal import Decimal

import requests
from django.conf import settings

FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"


class FlutterwaveError(Exception):
    def __init__(self, message: str, data: dict | None = None):
        super().__init__(message)
        self.data = data or {}


def _headers() -> dict:
    if not settings.FLUTTERWAVE_SECRET_KEY:
        raise FlutterwaveError("FLUTTERWAVE_SECRET_KEY is not configured on the server.")
    return {
        "Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}",
        "Content-Type": "application/json",
    }


def initialize_payment(*, email: str, full_name: str, amount: Decimal, tx_ref: str, redirect_url: str) -> dict:
    """Starts a Flutterwave Standard payment and returns the hosted checkout link.

    Returns Flutterwave's `data` object: {link}
    """
    payload = {
        "tx_ref": tx_ref,
        "amount": str(amount),
        "currency": "NGN",
        "redirect_url": redirect_url,
        "customer": {"email": email, "name": full_name},
        "customizations": {"title": "Sophisticat", "description": f"Order {tx_ref}"},
    }
    try:
        response = requests.post(
            f"{FLUTTERWAVE_BASE_URL}/payments",
            json=payload,
            headers=_headers(),
            timeout=15,
        )
    except requests.RequestException as exc:
        raise FlutterwaveError(f"Could not reach Flutterwave: {exc}") from exc

    body = response.json()
    if not response.ok or body.get("status") != "success":
        raise FlutterwaveError(body.get("message", "Flutterwave initialization failed."), data=body)
    return body["data"]


def verify_payment_by_reference(tx_ref: str) -> dict:
    """Confirms a transaction's status directly with Flutterwave using the
    merchant-supplied tx_ref (source of truth, used both by the callback
    flow and the webhook handler)."""
    try:
        response = requests.get(
            f"{FLUTTERWAVE_BASE_URL}/transactions/verify_by_reference",
            params={"tx_ref": tx_ref},
            headers=_headers(),
            timeout=15,
        )
    except requests.RequestException as exc:
        raise FlutterwaveError(f"Could not reach Flutterwave: {exc}") from exc

    body = response.json()
    if not response.ok or body.get("status") != "success":
        raise FlutterwaveError(body.get("message", "Flutterwave verification failed."), data=body)
    return body["data"]
