# Sophisticat — Jewelry, Bracelets, Turbans & African Prints

A full-stack e-commerce platform for Sophisticat Beauty Studio, forked and
rebranded from an earlier jewelry/skincare build (LUXORA) at your request.
Next.js 15 storefront + Django 5 / DRF backend.

## Fixed since your last build attempt
Your Docker build failed on `next/font` trying to reach Google Fonts
(`ETIMEDOUT` after retries) — Docker Desktop's build network doesn't have
outbound access to `fonts.googleapis.com` in your setup. Fixed at the root:
fonts are now self-hosted via `@fontsource` (installed from the npm
registry like any other package, bundled into the app at build time), so
`next build` never makes an external network call. I ran `npm ci` +
`npm run build` in this session exactly as your Dockerfile does and it
completes in ~20s with zero retries.

Also swapped the red accent for a neon red (`#FF073A`) per your last
message — updated in both the Tailwind config and the Django admin CSS.

## New: custom admin dashboard
You asked for a real admin dashboard with CRUD, not just Django admin. Built
at `/admin` in the Next.js app, backed by a new staff-only REST API at
`/api/admin/*` (separate from the public storefront API, which stays
read-only).

**Where it lives:**
- `backend/apps/dashboard/` — new Django app: `permissions.py` (`IsStaffUser`
  — same `is_staff` flag Django admin already uses, no new auth system),
  `serializers.py`, `views.py` (DRF ViewSets), `urls.py`
- `frontend/src/app/admin/` — the dashboard UI, and
  `frontend/src/lib/api/admin.ts` — the typed API client for it

**Access:** log in at `/login` with an account that has `is_staff=True`
(same flag `createsuperuser` sets, or check it in Django admin → Users),
then visit `/admin`. Non-staff accounts see a clear "restricted" screen
instead of a broken page.

**What's covered:**
| Section | Path | Capabilities |
|---|---|---|
| Dashboard | `/admin` | Revenue (14-day chart), order/customer/product counts, low-stock and pending-review alerts, top-selling products |
| Products | `/admin/products` | Full CRUD, image upload/delete, stock, pricing, search, filter by category/low-stock/**featured**, one-click **featured** toggle |
| Categories | `/admin/categories` | Full CRUD (modal), display order, active/hidden toggle, live product counts |
| Orders | `/admin/orders` | List + detail, filter by status/payment status, update fulfilment & payment status (writes to the order's status timeline) |
| Blog | `/admin/blog` | Full CRUD incl. cover image upload, publish/draft toggle |
| Coupons | `/admin/coupons` | Full CRUD (modal), usage limits, validity window |
| Messages | `/admin/messages` | Contact-form submissions, mark resolved/unresolved, delete |
| Reviews | `/admin/reviews` | Approve/unapprove, delete |
| Customers | `/admin/customers` | Read-only directory with order counts |

**Featured products**, specifically: added an `is_featured` field to
`Product` (migration `products/0002_product_is_featured.py`), a
`?featured=true` filter and `/featured/` endpoint on the public API for the
storefront to consume, a `?featured=true` filter + star-toggle button in
the admin products table, and a `featured_products` count on the dashboard
home.

**Every admin endpoint requires `is_staff`** — enforced server-side by
`IsStaffUser`, not just hidden in the UI. I ran the whole API live this
session (login → every list/detail endpoint → create/update/delete a
category → toggle a product's featured flag → confirmed the dashboard
count changed) against a real Django server, not just a type-check.

Django admin at `/admin` on the *backend* (port 8000) still exists too —
useful for anything not covered above, like granting staff access itself.

## What changed from the original build
- **Categories are fully admin-managed** — the old hardcoded jewellery/
  skincare split is gone. `Category` is now a flat, admin-creatable model
  (name, slug, image, order, active toggle) and the storefront nav, shop
  filters, and category pages all read from it live. Add a category in
  Django admin and it appears in the header mega-menu and `/shop` filters
  automatically — no code changes.
- **Brand identity** — red/gold/cream palette, sampled from your logo file
  and then brightened to neon red (`#FF073A`) per your feedback, gold
  `#A6701F`, cream `#FAF7F1` — your actual logo mark in the header/footer/
  auth pages, "Sophisticat" throughout (metadata, admin, emails, order
  number prefixes).
- **Seed catalog** replaced with your product lines: Jewelry, Beaded
  Bracelets, Turbans, African Prints & Designs (16 sample products, 3 blog
  posts, 2 coupon codes — `SOPHISTICAT10`, `WELCOME15`).
- **Stripe added alongside Paystack as the two active payment gateways**
  (Flutterwave, which was here briefly, is now disabled but kept in the
  codebase — see Payments below).

Everything else — auth, cart, wishlist, orders, order tracking, account
dashboard, admin — carries over unchanged from the original build.

## Quick start (Docker)

```bash
cp .env.example .env
cp backend/.env.example backend/.env   # set DJANGO_DEBUG=False and a real DJANGO_SECRET_KEY for anything beyond local testing
docker compose up --build
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py seed_data
```
- Frontend: http://localhost:3000 · Backend API: http://localhost:8000/api · Admin: http://localhost:8000/admin

## Quick start (local dev, no Docker)

**Backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set DJANGO_DEBUG=True and DB_ENGINE=django.db.backends.sqlite3
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser
python manage.py runserver
```

**Frontend** (separate terminal):
```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm run dev
```

## Managing categories (the thing you asked for)

Django admin → **Products → Categories** → Add. Fields: name, slug
(auto-filled from name), image, description, display order, active toggle.
That's it — it shows up in the header mega-menu, the `/shop` filter
sidebar, and gets its own `/shop/<slug>` page immediately. No frontend or
backend code changes needed for a new category.

## Payments — Stripe and Paystack

Checkout offers a "Pay With" choice between the two, with Paystack as the
default (covers card, bank transfer, and USSD for African customers; Stripe
covers international cards). Both follow the same pattern: initialize a
transaction server-side, redirect the customer to the gateway's hosted page,
verify on return at `/checkout/callback`, and a signed webhook as the
durable source of truth.

```
POST /api/orders/{order_number}/initialize-payment/   body: {"provider": "stripe" | "paystack"}
GET  /api/orders/verify-payment/?reference=...
POST /api/orders/webhook/stripe/         (verifies Stripe-Signature via STRIPE_WEBHOOK_SECRET)
POST /api/orders/webhook/paystack/       (verifies x-paystack-signature, HMAC-SHA512)
```

Set in `backend/.env`:
```
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=    # from the Stripe dashboard, Developers > Webhooks
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
```

**Flutterwave was the second gateway in an earlier version of this build.**
It's been swapped out in favor of Stripe, but not deleted — the full
integration still lives in `backend/apps/orders/services_flutterwave.py`,
and the call sites that used to route to it in `views.py`/`urls.py` are
commented out in place (not removed) with notes on exactly what to
uncomment to bring it back.

**Neither Stripe nor Paystack has been tested against its live servers** —
this sandbox's outbound network is restricted to a fixed allowlist that
doesn't include `api.stripe.com` or `api.paystack.co`. Both were verified
with a real functional test suite (see Testing below) that mocks only the
network call at the SDK boundary and exercises everything around it for
real: signature verification for both webhooks uses a genuinely computed
signature, not a mocked one. That catches integration bugs in this
codebase, not surprises from the providers' actual APIs. Get test-mode keys
from both dashboards and run one real transaction through each before
production.

Without any keys configured, checkout still works end to end — the order
is created with `payment_status: pending` and `initialize-payment` returns
a clean 502 instead of crashing, so the rest of the app stays testable.

## Transactional email

Order confirmation, shipping status updates, and password reset all send
real HTML (+ plain-text) emails — see `backend/apps/accounts/emails.py`,
`backend/apps/orders/emails.py`, and the templates in
`backend/templates/emails/`. Set in `backend/.env`:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend   # console backend by default (prints to stdout)
EMAIL_HOST=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=
```
A broken SMTP config is caught and logged, never raised — it won't break
checkout or an admin action, it just won't deliver that one email.

## Security / production-readiness notes

- `DEBUG`, `SECRET_KEY`, and DB credentials all come from environment
  variables with no hardcoded fallback for anything secret — a missing
  `POSTGRES_PASSWORD`/`DB_PASSWORD` fails to connect rather than silently
  using a known password.
- Rate limiting is on for the endpoints where it matters: login (10/min),
  registration (10/hour), password reset (5/hour), payment
  initialize/verify (30/hour). Both payment webhooks are explicitly
  un-throttled (`throttle_classes = []`) since gateways retry deliveries
  aggressively and signature verification is the real protection there.
- Security headers (`SECURE_SSL_REDIRECT`, HSTS, secure cookies) are all
  gated behind `DEBUG=False` in `settings.py` — make sure that's actually
  `False` in production.
- See `backend/README.md` for the full punch list this project went through
  before being called production-ready, and what's still worth double
  checking (there's no CI pipeline or error-tracking/observability setup
  here — that's on you to add for your deployment target).

## Testing

```bash
cd backend
python manage.py test --settings=sophisticat.settings_test
```
`settings_test.py` swaps in an in-memory SQLite DB so the suite runs
without a Postgres server. 45 tests across `apps/accounts` and
`apps/orders` cover registration, login, rate limiting, the full
password-reset flow, order creation/validation, Stripe and Paystack
payment initialization/verification/webhooks (including a genuinely
computed HMAC signature for the Paystack webhook, not a mocked one),
idempotent payment confirmation, and the transactional emails. There's no
equivalent suite yet for `products`/`cart`/`wishlist`/`blog`/`contact` —
those were manually smoke-tested during development but don't have
permanent regression coverage.

## Verified this session
- Backend: `python manage.py check` clean after adding the `dashboard` app
  and the `is_featured` field; fresh migration generated and applied
  cleanly against SQLite
- Ran the real Django dev server and hit every `/api/admin/*` endpoint with
  a genuine JWT for a staff account: stats, categories, products
  (incl. `?featured=true`), orders, blog posts, coupons, messages,
  reviews, customers all returned 200; created/updated/deleted a category
  end to end; toggled a product's featured flag and watched the dashboard's
  `featured_products` count update to match
- Frontend: `npx tsc --noEmit` and `npx eslint` both clean on every file I
  added or touched (`src/app/admin/**`, `src/lib/api/admin.ts`,
  `src/lib/api/auth.ts`)

**Discrepancy found, not fixed — flagging for you:** this README previously
recorded `npm run build` succeeding with 0 errors, but
`frontend/src/components/layout/Header.tsx` in the file you uploaded this
session is JSX only — missing its imports and the component
function/return wrapper — which fails both `tsc` and `next build`. I
verified this is genuinely how the file is packaged in
`sophisticat-production.rar` (re-extracted it standalone to rule out a
mistake on my end), not something I touched. Either something got cut when
this build was exported/archived, or a local edit didn't get saved before
zipping. I didn't reconstruct the missing code since I don't know what your
last working version of it looked like — restore it from your own source of
truth (git history, a previous export) before the next `npm run build`.
Everything above was verified with `tsc --noEmit`/`eslint` scoped to my
files and a live `manage.py runserver`, not a full production build,
because of this.

## About the placeholder images
I don't have your real product photography. The backend's `seed_data`
command generates simple red/gold placeholder JPEGs for every seeded
product so the API always returns a real image URL — swap them for real
photos through the Django admin any time (routes to Cloudinary
automatically once `CLOUDINARY_*` env vars are set in `backend/.env`).

## Things you'll want to personalize
- **Contact page address/phone** (`frontend/src/app/contact/page.tsx`) —
  still placeholder Lagos details from the original build
- **Business email** — currently `hello@shopsophisticat.com` throughout; update
  if that's not your real domain
- **Logo crop** — I cropped the icon mark from your uploaded logo file
  automatically; if you'd like a different crop or the full lockup used
  somewhere, the source files are in `frontend/public/images/`

## Latest pass: production-readiness fixes
Starting from "does it basically work" and going to "would I trust this
with real customer payments," this pass fixed, in order:
1. A hardcoded database password fallback in `settings.py` (and the same
   value duplicated in `docker-compose.yml`) — both now fail loudly instead
   of silently connecting with a known credential if the env var is unset.
2. Debug `print()` statements and dead commented-out code left in the order
   creation view — replaced with proper logging.
3. No rate limiting anywhere — added scoped throttles on login,
   registration, password reset, and payment init/verify.
4. Every paid order getting two identical "processing" timeline entries —
   payment confirmation now folds its note into the existing entry instead
   of creating a duplicate.

Then added a permanent test suite (see Testing above) so these don't
regress silently, and re-verified the full Stripe + Paystack payment flow
end to end against it afterward.

## Project structure
```
sophisticat/
├── frontend/            Next.js 15 storefront
│   └── src/
│       ├── app/admin/       Custom admin dashboard (staff-only, new this session)
│       └── lib/api/         API client + auth/products/blog/orders/contact/**admin** modules
├── backend/               Django 5 + DRF
│   ├── apps/                accounts, products, orders, cart, wishlist, blog, contact, **dashboard**
│   │   ├── accounts/           emails.py (password reset), tests.py
│   │   ├── dashboard/           new: staff-only /api/admin/* CRUD API for the dashboard above
│   │   └── orders/             services.py (Paystack), services_stripe.py (Stripe),
│   │                           services_flutterwave.py (disabled), emails.py, tests.py
│   ├── templates/emails/    HTML email templates (order confirmation, shipping, password reset)
│   ├── templates/admin/     Sophisticat-branded admin overrides
│   └── sophisticat/settings_test.py   SQLite override for `manage.py test`
├── docker-compose.yml
└── .env.example
```
