"""
Django settings for the SOPHISTICAT e-commerce backend.
"""

from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------
# Core
# ------------------------------------------------------------------
SECRET_KEY = config("DJANGO_SECRET_KEY")
DEBUG = config("DJANGO_DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("DJANGO_ALLOWED_HOSTS", cast=Csv())

# ------------------------------------------------------------------
# Applications
# ------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "cloudinary_storage",
    "cloudinary",
    # Local apps
    "apps.accounts",
    "apps.products",
    "apps.orders",
    "apps.cart",
    "apps.wishlist",
    "apps.blog",
    "apps.contact",
    "apps.dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "sophisticat.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "sophisticat.wsgi.application"
ASGI_APPLICATION = "sophisticat.asgi.application"

# ------------------------------------------------------------------
# Database
# ------------------------------------------------------------------

DB_ENGINE = config('DB_ENGINE', default='django.db.backends.postgresql')

DATABASES = {
    'default': {
        # Configurable so DB_ENGINE=django.db.backends.sqlite3 (per
        # .env.example) works for local dev without touching this file.
        # Defaults to postgres, matching production/Docker Compose.
        'ENGINE': DB_ENGINE,
        # Support both POSTGRES_* (Docker Compose convention) and DB_* (legacy)
        'NAME': config('POSTGRES_DB', default=config('DB_NAME', default=BASE_DIR / 'db.sqlite3')),
        'USER': config('POSTGRES_USER', default=config('DB_USER', default='sophisticat_admin')),
        # No hardcoded fallback on purpose: if this isn't set in the
        # environment, connecting should fail loudly rather than silently
        # succeed against a known, repo-visible password.
        'PASSWORD': config('POSTGRES_PASSWORD', default=config('DB_PASSWORD', default='')),
        'HOST': config('POSTGRES_HOST', default=config('DB_HOST', default='db')),
        'PORT': config('POSTGRES_PORT', default=config('DB_PORT', default='5432')),
        'CONN_MAX_AGE': 60,
        # connect_timeout is a postgres-specific connection option; Python's
        # sqlite3 connector rejects it outright, so only pass it when we're
        # actually talking to postgres.
        'OPTIONS': {'connect_timeout': 10} if DB_ENGINE == 'django.db.backends.postgresql' else {},
    }
}
# ------------------------------------------------------------------
# Custom user model
# ------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ------------------------------------------------------------------
# Internationalization
# ------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Lagos"
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------
# Static & media files
# ------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": config("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": config("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": config("CLOUDINARY_API_SECRET", default=""),
}

# Only route media through Cloudinary once real credentials are supplied —
# otherwise fall back to local disk storage so `runserver` works out of the box.
_default_storage = (
    "cloudinary_storage.storage.MediaCloudinaryStorage"
    if config("CLOUDINARY_CLOUD_NAME", default="")
    else "django.core.files.storage.FileSystemStorage"
)

STORAGES = {
    "default": {"BACKEND": _default_storage},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ------------------------------------------------------------------
# Django REST Framework
# ------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticatedOrReadOnly",),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    # So production doesn't expose the browsable API, change this in development.
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
    "DATETIME_FORMAT": "iso-8601",
    # General throttles apply to every endpoint by default (catalog
    # browsing, cart, etc). The tighter "auth-*"/"payment-*" scopes below are
    # applied explicitly on the handful of views where brute-forcing or
    # spamming is a real risk (login, registration, password reset,
    # initiating a payment) — see throttle_scope on those view classes.
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/hour",
        "user": "2000/hour",
        "auth-login": "10/minute",
        "auth-register": "10/hour",
        "auth-password-reset": "5/hour",
        "payment-init": "30/hour",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# ------------------------------------------------------------------
# CORS — allow the Next.js frontend
# ------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="https://shopsophisticat.com,https://www.shopsophisticat.com",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="https://shopsophisticat.com,https://www.shopsophisticat.com",
    cast=Csv(),
)

# ------------------------------------------------------------------
# Security (production)
# ------------------------------------------------------------------
if not DEBUG:
    # Trust nginx's X-Forwarded-Proto header for request.is_secure().
    # Required whenever TLS is terminated upstream (nginx) and proxied to
    # gunicorn over plain HTTP -- without this, SECURE_SSL_REDIRECT below
    # causes an infinite redirect loop, since Django would otherwise see
    # every request as insecure and keep redirecting to https.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
    SESSION_COOKIE_SECURE = True

    SESSION_COOKIE_HTTPONLY = True
    CSRF_COOKIE_HTTPONLY = False
    SESSION_COOKIE_AGE = 86400
    SESSION_EXPIRE_AT_BROWSER_CLOSE = False

    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_CONTENT_TYPE_NOSNIFF = True

    SECURE_BROWSER_XSS_FILTER = True
    SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
    SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
    X_FRAME_OPTIONS = "DENY"
    # The Docker HEALTHCHECK hits /health/ directly inside the container
    # (bypassing nginx, so no X-Forwarded-Proto header) -- exempt it so it
    # gets a real 200/503 reflecting actual DB connectivity, not a 301.
    SECURE_REDIRECT_EXEMPT = [r"^health/$"]

# ------------------------------------------------------------------
# Email (order confirmations, password resets)
# ------------------------------------------------------------------
EMAIL_BACKEND = config(
    "EMAIL_BACKEND", default="django.core.mail.backends.console.EmailBackend"
)
EMAIL_HOST = config("EMAIL_HOST", default="smtp.zoho.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_USE_SSL = config("EMAIL_USE_SSL", default=False, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="Sophisticat <hello@shopsophisticat.com>")

# ------------------------------------------------------------------
# Payments — Stripe and Paystack are both active providers (the frontend's
# payment picker lets the customer choose). Flutterwave is fully implemented
# (see services_flutterwave.py) but currently disabled at the view/URL
# layer; its settings are kept here so switching it back on later is just
# uncommenting code, not reconfiguring env.
# ------------------------------------------------------------------
STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", default="")
STRIPE_PUBLISHABLE_KEY = config("STRIPE_PUBLISHABLE_KEY", default="")
# Set in the Stripe dashboard under Developers > Webhooks — used to verify
# the `Stripe-Signature` header on incoming webhook requests.
STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", default="")

PAYSTACK_SECRET_KEY = config("PAYSTACK_SECRET_KEY", default="")
PAYSTACK_PUBLIC_KEY = config("PAYSTACK_PUBLIC_KEY", default="")
FLUTTERWAVE_SECRET_KEY = config("FLUTTERWAVE_SECRET_KEY", default="")
FLUTTERWAVE_PUBLIC_KEY = config("FLUTTERWAVE_PUBLIC_KEY", default="")
# Set in the Flutterwave dashboard under Settings > Webhooks — used to verify
# the `verif-hash` header on incoming webhook requests (not an HMAC of the
# body like Paystack; Flutterwave just echoes back this shared secret).
FLUTTERWAVE_SECRET_HASH = config("FLUTTERWAVE_SECRET_HASH", default="")

FRONTEND_URL = config("FRONTEND_URL")
