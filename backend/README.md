# Sophisticat Backend — Django 5 + DRF

## Setup (local dev, SQLite)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# then edit .env:
#   DJANGO_DEBUG=True
#   DB_ENGINE=django.db.backends.sqlite3
#   (delete/leave blank DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT — sqlite ignores them)

python manage.py migrate
python manage.py seed_data       # loads categories, products, coupons, blog posts
python manage.py createsuperuser
python manage.py runserver
```

API is now live at `http://localhost:8000/api/`, admin at `http://localhost:8000/admin/`.

## Setup (Postgres, matches Docker/production)

Fill in `DB_ENGINE=django.db.backends.postgresql` plus `DB_NAME`, `DB_USER`,
`DB_PASSWORD`, `DB_HOST`, `DB_PORT` in `.env`, make sure Postgres is running,
then run the same `migrate` / `seed_data` / `createsuperuser` commands above.

## Verified

Every model, serializer, view, and URL in this app was run against a real
SQLite database during development — `makemigrations`, `migrate`, and
`seed_data` all execute cleanly, and the following flows were smoke-tested
live: register → login (JWT) → browse products/categories → add to cart →
place order (stock decrements, status timeline created) → add to wishlist.

## Apps

| App | Responsibility |
|---|---|
| `accounts` | Custom `User` (email login), `Address`, JWT auth, profile, password change |
| `products` | `Category`, `Product`, `ProductImage`, `ProductVariant`, `Review`, `Coupon` |
| `orders` | `Order`, `OrderItem`, `OrderStatusEvent` (tracking timeline) |
| `cart` | Server-side persistent cart per user |
| `wishlist` | Per-user saved products |
| `blog` | `BlogPost` |
| `contact` | `ContactMessage` inbox (visible in admin) |

## Key API Endpoints

```
POST   /api/auth/register/            Create account, returns JWT pair
POST   /api/auth/login/               Login, returns JWT pair + user
POST   /api/auth/refresh/             Refresh access token
POST   /api/auth/logout/              Blacklist refresh token
GET    /api/auth/me/                  Current user profile
PATCH  /api/auth/me/                  Update profile
POST   /api/auth/change-password/     Change password (requires current_password)
POST   /api/auth/password-reset/      Request a reset email {email} — always 200, never leaks account existence
POST   /api/auth/password-reset/confirm/   Set new password {uid, token, new_password}
GET    /api/auth/addresses/           List addresses
POST   /api/auth/addresses/           Add address

GET    /api/categories/               List categories
GET    /api/products/                 List products (filter/search/order — see below)
GET    /api/products/{slug}/          Product detail (images, variants, reviews)
GET    /api/products/best_sellers/    Best-seller products
GET    /api/products/{slug}/related/  Related products
GET    /api/reviews/?product={slug}   Reviews for a product
POST   /api/reviews/                  Create a review (auth required)
POST   /api/coupons/apply/            Validate a coupon code

GET    /api/cart/                     Current user's cart
POST   /api/cart/                     Add item {product_id, quantity, variant_label}
PATCH  /api/cart/items/{id}/          Update item quantity (by cart item id)
DELETE /api/cart/items/{id}/          Remove item (by cart item id)
PATCH  /api/cart/items/by-product/{product_id}/   Update quantity (by product id)
DELETE /api/cart/items/by-product/{product_id}/   Remove item (by product id)
DELETE /api/cart/                     Clear cart
POST   /api/cart/apply-coupon/        Apply coupon to cart {code}

GET    /api/orders/                   List my orders
POST   /api/orders/                   Place an order from cart items
GET    /api/orders/{order_number}/    Order detail (mine only)
GET    /api/orders/track/{number}/    Public tracking lookup (no auth)
POST   /api/orders/{order_number}/initialize-payment/   body: {"provider": "stripe"|"paystack"}, returns authorization_url — rate limited (30/hour)
GET    /api/orders/verify-payment/?reference=   Confirm a transaction directly with the order's provider — rate limited (30/hour)
POST   /api/orders/webhook/stripe/    Stripe server-to-server webhook (Stripe-Signature verified)
POST   /api/orders/webhook/paystack/  Paystack server-to-server webhook (HMAC-SHA512 verified)

GET    /api/wishlist/                 List my wishlist
POST   /api/wishlist/                 Add {product_id}
DELETE /api/wishlist/{id}/            Remove (by wishlist item id)
DELETE /api/wishlist/by-product/{product_id}/   Remove (by product id)

GET    /api/blog/                     List blog posts (filter by ?category=)
GET    /api/blog/{slug}/              Blog post detail

POST   /api/contact/                  Submit a contact message
POST   /api/contact/newsletter/       Subscribe an email to the newsletter
```

**Product filtering:** `/api/products/?group=jewellery&category=necklaces&min_price=50000&max_price=150000&min_rating=4&best_seller=true&search=gold&ordering=-price`

## Seed data

`python manage.py seed_data` loads the same 8 categories / 14 products /
2 coupons (`LUXORA10`, `WELCOME15`) / 3 blog posts as the frontend's mock
data, so both sides match exactly during development. Product/blog images
are generated as simple gold-on-ink placeholder JPEGs at seed time — swap
real photography in via the admin panel (uploads route to Cloudinary
automatically once `CLOUDINARY_*` env vars are set).

## Frontend integration

Fully wired — see the top-level `README.md` for what's connected and the
live end-to-end test that was run against this exact API (register → browse
→ wishlist → cart → coupon → order, with real totals verified).

## Payments (Stripe + Paystack)

Checkout lets the customer choose either gateway; the request body to
`initialize-payment` takes `{"provider": "stripe" | "paystack"}` (defaults
to `"stripe"` if omitted).

Set in `.env` (test keys from either dashboard work fine for development):
```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
```
Without a key set for the chosen provider, `initialize-payment` returns a
clean 502 rather than crashing, so the rest of the app stays testable even
before you have gateway credentials.

To receive webhooks locally, expose your dev server (e.g. via `ngrok http
8000`) and set:
- Stripe: `<url>/api/orders/webhook/stripe/` in the Stripe dashboard under
  Developers > Webhooks, listening for `checkout.session.completed`. Copy
  the signing secret it gives you into `STRIPE_WEBHOOK_SECRET` — see
  `apps/orders/services_stripe.py::construct_webhook_event`.
- Paystack: `<url>/api/orders/webhook/paystack/` in the Paystack dashboard.
  Verifies the `x-paystack-signature` header (HMAC-SHA512 of the body using
  your secret key) — see `apps/orders/views.py::PaystackWebhookView`.

Order model tracks which gateway was used via `payment_provider`
(`stripe` | `paystack` | `flutterwave`), set automatically at
`initialize-payment` time. `flutterwave` stays a valid choice even though
that integration is currently disabled — see below.

**Flutterwave** was briefly the second gateway here before Stripe replaced
it. The integration is fully intact in `apps/orders/services_flutterwave.py`
and hasn't been touched — it's just not wired up at the view/URL layer
anymore. `apps/orders/views.py` and `urls.py` both have the exact
commented-out lines needed to bring it back as a third option.

Neither Stripe nor Paystack has been run against real API servers in this
environment (outbound network here doesn't reach `api.stripe.com` or
`api.paystack.co`) — see the root `README.md`'s Payments section for what
was and wasn't verified, and get one real test-mode transaction through
each before trusting this in production.

## Testing

```bash
python manage.py test --settings=sophisticat.settings_test
```
Uses an in-memory SQLite DB (`sophisticat/settings_test.py`) so it runs
without Postgres. Covers, across `apps/accounts/tests.py` and
`apps/orders/tests.py` (45 tests total):
- Registration, login, and change-password, including rate limiting on each
- The full password-reset flow (request, confirm, invalid-token rejection,
  and confirming it never leaks whether an email is registered)
- Order creation and its validation (missing fields, out-of-stock)
- Stripe: initialize, verify (success/failure), webhook, idempotent
  re-verification, and gateway-error handling (502, not 500)
- Paystack: same coverage, plus a webhook test that computes a **real**
  HMAC-SHA512 signature rather than mocking signature verification, and a
  companion test confirming a forged signature is rejected
- Provider co-existence (defaulting to Stripe, explicit Paystack, unknown
  provider rejected) and the payment-init rate limit
- The order-status-event dedup fix (one "processing" entry per order, not
  two) and both transactional email functions directly, including that a
  simulated SMTP failure doesn't raise

`products`, `cart`, `wishlist`, `blog`, and `contact` don't have permanent
test coverage yet — they were manually smoke-tested during development but
would be the next place to extend this suite.

## Production-readiness notes

- No hardcoded fallback for `SECRET_KEY` or DB credentials in
  `settings.py` — everything secret comes from the environment, and a
  missing DB password fails the connection instead of silently succeeding.
- `SECURE_SSL_REDIRECT`/HSTS/secure cookies are gated behind `DEBUG=False`
  — confirm that's actually set in your deployment.
- Rate limiting via DRF's `ScopedRateThrottle` on login, registration,
  password reset, and payment init/verify; both payment webhooks are
  explicitly exempted (`throttle_classes = []`) since gateways retry
  aggressively and rely on signature verification, not rate limits, for
  protection.
- No CI pipeline, error tracking (e.g. Sentry), or structured logging
  aggregation configured — worth adding before real traffic, not something
  this project sets up for you.
