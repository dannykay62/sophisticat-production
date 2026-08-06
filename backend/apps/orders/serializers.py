from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.products.models import Coupon, Product

from .models import Order, OrderItem, OrderStatusEvent

FREE_SHIPPING_THRESHOLD = 100000
FLAT_SHIPPING_FEE = 4990


class OrderItemSerializer(serializers.ModelSerializer):
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ["id", "product_slug", "product_name", "image", "unit_price", "quantity", "variant_label", "line_total"]

    def get_image(self, obj):
        first = obj.product.images.first()
        if not first:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(first.image.url) if request else first.image.url


class OrderStatusEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatusEvent
        fields = ["status", "note", "created_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_events = OrderStatusEventSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "tracking_number", "status", "payment_method", "payment_status",
            "full_name", "email", "phone", "address", "city", "state", "shipping_address_display",
            "subtotal", "discount", "shipping_fee", "total", "coupon_code",
            "items", "status_events", "created_at",
        ]
        read_only_fields = fields


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)
    variant_label = serializers.CharField(required=False, allow_blank=True, default="")


class OrderCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    address = serializers.CharField(max_length=255)
    city = serializers.CharField(max_length=100)
    state = serializers.CharField(max_length=100)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default="")
    items = OrderItemInputSerializer(many=True)

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Your order must include at least one item.")
        for item in items:
            try:
                product = Product.objects.get(id=item["product_id"], is_active=True)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product {item['product_id']} is not available.")
            if product.stock_quantity < item["quantity"]:
                raise serializers.ValidationError(f"Not enough stock for {product.name}.")
        return items

    def validate_coupon_code(self, code):
        if not code:
            return code
        try:
            coupon = Coupon.objects.get(code=code.strip().upper())
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("That coupon code doesn't exist.")
        if not coupon.is_valid():
            raise serializers.ValidationError("That coupon code has expired.")
        return code.strip().upper()

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        items_data = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", "")

        # Lock product rows in a stable order (by id) to avoid deadlocks between
        # concurrent checkouts that share products, then re-validate stock under
        # the lock -- the earlier validate_items() check is unlocked and can be
        # stale by the time we get here.
        product_ids = sorted({str(item["product_id"]) for item in items_data})
        locked_products = {
            str(p.id): p
            for p in Product.objects.select_for_update().filter(id__in=product_ids, is_active=True)
        }

        subtotal = 0
        resolved_items = []
        for item in items_data:
            product = locked_products.get(str(item["product_id"]))
            if product is None:
                raise serializers.ValidationError(f"Product {item['product_id']} is not available.")
            if product.stock_quantity < item["quantity"]:
                raise serializers.ValidationError(f"Not enough stock for {product.name}.")
            line_total = product.price * item["quantity"]
            subtotal += line_total
            resolved_items.append((product, item["quantity"], item.get("variant_label", "")))

        discount = 0
        coupon = None
        if coupon_code:
            # Lock the coupon row too so a usage_limit can't be exceeded by two
            # simultaneous checkouts both reading the same times_used value.
            coupon = Coupon.objects.select_for_update().get(code=coupon_code)
            if not coupon.is_valid():
                raise serializers.ValidationError("That coupon code has expired.")
            discount = round(subtotal * Decimal(coupon.discount_percent) / Decimal(100))

        shipping_fee = 0 if subtotal >= FREE_SHIPPING_THRESHOLD or subtotal == 0 else FLAT_SHIPPING_FEE
        total = subtotal - discount + shipping_fee

        order = Order.objects.create(
            user=request.user,
            subtotal=subtotal,
            discount=discount,
            shipping_fee=shipping_fee,
            total=total,
            coupon_code=coupon_code,
            **validated_data,
        )

        for product, quantity, variant_label in resolved_items:
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                unit_price=product.price,
                quantity=quantity,
                variant_label=variant_label,
            )
            product.stock_quantity = max(0, product.stock_quantity - quantity)
            product.save(update_fields=["stock_quantity"])

        if coupon is not None:
            coupon.times_used += 1
            coupon.save(update_fields=["times_used"])

        OrderStatusEvent.objects.create(order=order, status="processing", note="Order placed successfully.")
        return order
