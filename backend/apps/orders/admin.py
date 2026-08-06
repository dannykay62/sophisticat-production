from django.contrib import admin
from django.utils.html import format_html

from .emails import send_shipping_update_email
from .models import Order, OrderItem, OrderStatusEvent


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product_name", "unit_price", "quantity", "variant_label"]
    can_delete = False


class OrderStatusEventInline(admin.TabularInline):
    model = OrderStatusEvent
    extra = 1


STATUS_COLORS = {
    "processing": "#B0863A",
    "shipped": "#2563eb",
    "out-for-delivery": "#d97706",
    "delivered": "#16a34a",
    "cancelled": "#dc2626",
}


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "full_name", "status_badge", "payment_status", "total_display", "created_at"]
    list_filter = ["status", "payment_status", "payment_provider", "payment_method"]
    search_fields = ["order_number", "tracking_number", "full_name", "email"]
    readonly_fields = ["order_number", "tracking_number", "subtotal", "discount", "shipping_fee", "total", "created_at", "updated_at"]
    inlines = [OrderItemInline, OrderStatusEventInline]

    fieldsets = (
        ("Order Info", {"fields": ("order_number", "tracking_number", "user", "status")}),
        ("Customer & Shipping", {"fields": ("full_name", "email", "phone", "address", "city", "state")}),
        ("Payment", {"fields": ("payment_method", "payment_provider", "payment_status", "payment_reference")}),
        ("Totals", {"fields": ("subtotal", "discount", "shipping_fee", "total", "coupon_code")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    @admin.display(description="Status")
    def status_badge(self, obj):
        color = STATUS_COLORS.get(obj.status, "#666")
        return format_html(
            '<span style="background:{}20;color:{};padding:3px 10px;border-radius:20px;font-size:11px;text-transform:uppercase">{}</span>',
            color, color, obj.get_status_display(),
        )

    @admin.display(description="Total")
    def total_display(self, obj):
        return f"₦{obj.total:,.0f}"

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, OrderStatusEvent):
                is_new = instance.pk is None
                instance.save()
                instance.order.status = instance.status
                instance.order.save(update_fields=["status"])
                if is_new:
                    send_shipping_update_email(instance)
            else:
                instance.save()
        formset.save_m2m()
