"""
Settings for running the test suite (`python manage.py test --settings=sophisticat.settings_test`).

Everything is inherited from settings.py except the database, which is
swapped for an in-memory SQLite DB so `manage.py test` doesn't require a
running Postgres server. Also sets throwaway values for the third-party
secrets the payment/email code checks for, since the test suite always mocks
the actual network calls to Stripe/Paystack rather than hitting their APIs.
"""

import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-secret-key-not-for-production")
# Must be set before settings.py is imported below — it's what gates
# SECURE_SSL_REDIRECT/HSTS/secure-cookies there, and Django's test client
# talks plain HTTP, so leaving those on would 301-redirect every test request.
os.environ.setdefault("DJANGO_DEBUG", "True")

from .settings import *  # noqa: F401,F403

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

STRIPE_SECRET_KEY = "sk_test_fake"
STRIPE_WEBHOOK_SECRET = "whsec_test_fake"
PAYSTACK_SECRET_KEY = "sk_test_paystack_fake"

# Speeds up password hashing in tests — doesn't affect production, which
# still uses settings.py's default (Django's standard PBKDF2 hasher).
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
