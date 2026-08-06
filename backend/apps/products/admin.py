from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Coupon, Product, ProductImage, ProductVariant, Review


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["thumbnail", "name", "slug", "order", "is_active", "product_count"]
    list_editable = ["order", "is_active"]
    list_filter = ["is_active"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["order"]

    @admin.display(description="Image")
    def thumbnail(self, obj):
        if obj.image:
            return format_html('<img src="{}" style="height:36px;width:36px;object-fit:cover;border-radius:4px" />', obj.image.url)
        return "—"

    @admin.display(description="Products")
    def product_count(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["thumbnail", "name", "category", "price_display", "stock_status", "is_best_seller", "is_active"]
    list_filter = ["category", "is_best_seller", "is_new", "is_active"]
    search_fields = ["name", "sku", "description"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline, ProductVariantInline]
    list_editable = ["is_best_seller", "is_active"]
    readonly_fields = ["sku"]

    fieldsets = (
        ("Basic Information", {"fields": ("name", "slug", "category", "description", "features")}),
        ("Pricing & Inventory", {"fields": ("price", "compare_at_price", "stock_quantity", "sku")}),
        ("Visibility", {"fields": ("is_best_seller", "is_new", "is_active")}),
    )

    @admin.display(description="Image")
    def thumbnail(self, obj):
        first = obj.images.first()
        if first:
            return format_html('<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:4px" />', first.image.url)
        return "—"

    @admin.display(description="Price")
    def price_display(self, obj):
        return f"₦{obj.price:,.0f}"

    @admin.display(description="Stock")
    def stock_status(self, obj):
        color = "#16a34a" if obj.stock_quantity > 10 else "#dc2626" if obj.stock_quantity == 0 else "#d97706"
        return format_html('<span style="color:{}">{} units</span>', color, obj.stock_quantity)


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "rating", "title", "is_verified_purchase", "is_approved", "created_at"]
    list_filter = ["rating", "is_approved", "is_verified_purchase"]
    list_editable = ["is_approved"]
    search_fields = ["product__name", "user__email", "title"]


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ["code", "discount_percent", "is_active", "valid_from", "valid_until", "times_used", "usage_limit"]
    list_filter = ["is_active"]
    search_fields = ["code"]
