from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connections
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.urls import include, path

admin.site.site_header = "SOPHISTICAT Admin"
admin.site.site_title = "SOPHISTICAT Admin"
admin.site.index_title = "Store Management"


def health_check(request):
    """Liveness/readiness probe for Docker healthchecks, nginx upstream
    checks, and any external uptime monitor. Verifies the DB connection is
    actually usable rather than just returning a static 200 — a container
    that's up but can't reach Postgres should fail its healthcheck."""
    try:
        connections["default"].cursor().execute("SELECT 1")
    except OperationalError:
        return JsonResponse({"status": "error", "detail": "database unreachable"}, status=503)
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.products.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/blog/", include("apps.blog.urls")),
    path("api/contact/", include("apps.contact.urls")),
    path("api/admin/", include("apps.dashboard.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
