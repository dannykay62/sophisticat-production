from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.blog.models import BlogPost
from apps.contact.models import ContactMessage, NewsletterSubscriber
from apps.orders.models import Order
from apps.orders.serializers import OrderItemSerializer, OrderStatusEventSerializer
from apps.products.models import Category, Coupon, Product, ProductImage, ProductVariant, Review

User = get_user_model()


# ---------------------------------------------------------------------------
# Categories
# ---------------------------------------------------------------------------
class AdminCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source="products.count", read_only=True)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image", "description", "order", "is_active", "product_count"]
        read_only_fields = ["id", "slug"]


# ---------------------------------------------------------------------------
# Products
# ---------------------------------------------------------------------------
class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "order"]


class AdminProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name", "value", "price_override", "stock_quantity"]


class AdminProductListSerializer(serializers.ModelSerializer):
    """Lightweight row for the products table."""

    category_name = serializers.CharField(source="category.name", read_only=True)
    primary_image = serializers.SerializerMethodField()
    rating = serializers.FloatField(source="average_rating", read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category", "category_name", "price", "compare_at_price",
            "stock_quantity", "is_best_seller", "is_new", "is_featured", "is_active", "primary_image",
            "rating", "review_count", "created_at", "updated_at",
        ]

    def get_primary_image(self, obj):
        first = obj.images.first()
        if not first:
            return None
        request = self.context.get("request")
        url = first.image.url
        return request.build_absolute_uri(url) if request else url


class AdminProductDetailSerializer(serializers.ModelSerializer):
    """Full read/write serializer used for create, retrieve, and update."""

    images = AdminProductImageSerializer(many=True, read_only=True)
    variants = AdminProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "sku", "category", "category_name", "description", "features",
            "price", "compare_at_price", "stock_quantity", "is_best_seller", "is_new", "is_featured", "is_active",
            "images", "variants", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_features(self, value):
        if value in (None, ""):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError("Features must be a list of short strings.")
        return value


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------
class AdminOrderListSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="email", read_only=True)
    item_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "tracking_number", "full_name", "customer_email", "status",
            "payment_status", "payment_provider", "total", "item_count", "created_at",
        ]
        read_only_fields = fields


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_events = OrderStatusEventSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "tracking_number", "user", "status", "payment_method",
            "payment_provider", "payment_status", "payment_reference", "full_name", "email", "phone",
            "address", "city", "state", "shipping_address_display", "subtotal", "discount",
            "shipping_fee", "total", "coupon_code", "items", "status_events", "created_at", "updated_at",
        ]
        read_only_fields = [f for f in fields if f not in ("status", "payment_status")]


class AdminOrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES, required=False)
    payment_status = serializers.ChoiceField(choices=Order.PAYMENT_STATUS_CHOICES, required=False)
    note = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate(self, attrs):
        if "status" not in attrs and "payment_status" not in attrs:
            raise serializers.ValidationError("Provide at least one of: status, payment_status.")
        return attrs


# ---------------------------------------------------------------------------
# Blog
# ---------------------------------------------------------------------------
class AdminBlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = [
            "id", "title", "slug", "excerpt", "content", "image", "category",
            "read_time", "is_published", "published_at",
        ]
        read_only_fields = ["id", "slug", "published_at"]


# ---------------------------------------------------------------------------
# Coupons
# ---------------------------------------------------------------------------
class AdminCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id", "code", "discount_percent", "is_active", "valid_from", "valid_until",
            "usage_limit", "times_used",
        ]
        read_only_fields = ["id", "times_used"]


# ---------------------------------------------------------------------------
# Contact / newsletter
# ---------------------------------------------------------------------------
class AdminContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "subject", "message", "is_resolved", "created_at"]
        read_only_fields = ["id", "name", "email", "subject", "message", "created_at"]


class AdminNewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = ["id", "email", "subscribed_at"]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Reviews (moderation)
# ---------------------------------------------------------------------------
class AdminReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    author = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "product", "product_name", "author", "rating", "title", "body",
            "is_verified_purchase", "is_approved", "created_at",
        ]
        read_only_fields = ["id", "product", "product_name", "author", "rating", "title", "body",
                             "is_verified_purchase", "created_at"]


# ---------------------------------------------------------------------------
# Customers (read-only directory)
# ---------------------------------------------------------------------------
class AdminUserSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(source="orders.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "first_name", "last_name", "phone",
            "is_staff", "is_active", "date_joined", "order_count",
        ]
        read_only_fields = fields
