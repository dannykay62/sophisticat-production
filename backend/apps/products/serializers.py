from rest_framework import serializers

from .models import Category, Coupon, Product, ProductImage, ProductVariant, Review


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "image", "description", "order"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "order"]


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name", "value", "price_override", "stock_quantity"]


class ReviewSerializer(serializers.ModelSerializer):
    author = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "author", "rating", "title", "body", "is_verified_purchase", "created_at"]
        read_only_fields = ["id", "is_verified_purchase", "created_at"]


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["product", "rating", "title", "body"]

    def validate(self, attrs):
        request = self.context["request"]
        if Review.objects.filter(product=attrs["product"], user=request.user).exists():
            raise serializers.ValidationError("You've already reviewed this product.")
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        from apps.orders.models import OrderItem

        has_purchased = OrderItem.objects.filter(
            order__user=request.user, product=validated_data["product"], order__status="delivered"
        ).exists()
        return Review.objects.create(user=request.user, is_verified_purchase=has_purchased, **validated_data)


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for grid/list views."""

    category = serializers.CharField(source="category.slug", read_only=True)
    rating = serializers.FloatField(source="average_rating", read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "slug", "name", "category", "price", "compare_at_price",
            "rating", "review_count", "in_stock", "is_best_seller", "is_new", "is_featured", "primary_image",
        ]

    def get_primary_image(self, obj):
        first = obj.images.first()
        if not first:
            return None
        request = self.context.get("request")
        url = first.image.url
        return request.build_absolute_uri(url) if request else url


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    rating = serializers.FloatField(source="average_rating", read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "slug", "name", "category", "description", "features",
            "price", "compare_at_price", "rating", "review_count", "in_stock",
            "stock_quantity", "sku", "is_best_seller", "is_new", "is_featured", "images", "variants", "reviews",
        ]


class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField()

    def validate_code(self, value):
        try:
            coupon = Coupon.objects.get(code=value.strip().upper())
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("That coupon code doesn't exist.")
        if not coupon.is_valid():
            raise serializers.ValidationError("That coupon code has expired or reached its usage limit.")
        return coupon
