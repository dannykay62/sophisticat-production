from decimal import Decimal

from rest_framework import serializers

from apps.products.models import Coupon, Product

from .models import Cart, CartItem

FREE_SHIPPING_THRESHOLD = 100000
FLAT_SHIPPING_FEE = 4990


# class CartItemSerializer(serializers.ModelSerializer):
#     product_slug = serializers.CharField(source="product.slug", read_only=True)
#     product_name = serializers.CharField(source="product.name", read_only=True)
#     unit_price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
#     image = serializers.SerializerMethodField()
#     line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

#     class Meta:
#         model = CartItem
#         fields = ["id", "product", "product_slug", "product_name", "unit_price", "image", "quantity", "variant_label", "line_total"]
#         extra_kwargs = {"product": {"write_only": True}}

#     def get_image(self, obj):
#         first = obj.product.images.first()
#         if not first:
#             return None
#         request = self.context.get("request")
#         return request.build_absolute_uri(first.image.url) if request else first.image.url


class CartItemSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(source="product.id", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    unit_price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2, read_only=True)
    image = serializers.SerializerMethodField()
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "product_slug", "product_name", "unit_price", "image", "quantity", "variant_label", "line_total"]
        extra_kwargs = {"product": {"write_only": True}}

    def get_image(self, obj):
        first = obj.product.images.first()
        if not first:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(first.image.url) if request else first.image.url


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    shipping_fee = serializers.SerializerMethodField()
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "coupon_code", "subtotal", "discount", "discount_percent", "shipping_fee", "total", "updated_at"]

    def get_subtotal(self, obj):
        return sum((item.line_total for item in obj.items.all()), Decimal("0"))

    def _coupon_discount_percent(self, obj):
        if not obj.coupon_code:
            return 0
        coupon = Coupon.objects.filter(code=obj.coupon_code).first()
        if not coupon or not coupon.is_valid():
            return 0
        return coupon.discount_percent

    def get_discount_percent(self, obj):
        return self._coupon_discount_percent(obj)

    def get_discount(self, obj):
        subtotal = self.get_subtotal(obj)
        percent = self._coupon_discount_percent(obj)
        return round(subtotal * Decimal(percent) / Decimal(100))

    def get_shipping_fee(self, obj):
        subtotal = self.get_subtotal(obj)
        if subtotal == 0 or subtotal >= FREE_SHIPPING_THRESHOLD:
            return 0
        return FLAT_SHIPPING_FEE

    def get_total(self, obj):
        return self.get_subtotal(obj) - self.get_discount(obj) + self.get_shipping_fee(obj)


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    variant_label = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_product_id(self, value):
        if not Product.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Product not found.")
        return value


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
