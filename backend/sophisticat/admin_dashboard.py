"""
Adds a small stats panel to the top of the default Django admin index page.
Patches `admin.site.index` directly (rather than swapping in a custom
AdminSite) so every app's existing `@admin.register(...)` calls keep working
unchanged.
"""

from types import MethodType

from django.contrib import admin
from django.contrib.admin.sites import AdminSite
from django.db.models import Sum

_original_index = AdminSite.index


def _index_with_stats(self, request, extra_context=None):
    extra_context = extra_context or {}

    from apps.contact.models import ContactMessage
    from apps.orders.models import Order
    from apps.products.models import Product

    orders_qs = Order.objects.all()
    extra_context["sophisticat_stats"] = {
        "total_products": Product.objects.filter(is_active=True).count(),
        "total_orders": orders_qs.count(),
        "pending_orders": orders_qs.filter(status="processing").count(),
        "total_revenue": orders_qs.filter(payment_status="paid").aggregate(total=Sum("total"))["total"] or 0,
        "unread_messages": ContactMessage.objects.filter(is_resolved=False).count(),
        "low_stock": Product.objects.filter(is_active=True, stock_quantity__lte=10).count(),
    }
    return _original_index(self, request, extra_context)


def install_dashboard_stats():
    admin.site.index = MethodType(_index_with_stats, admin.site)
