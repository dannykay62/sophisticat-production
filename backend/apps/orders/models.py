import uuid

from django.conf import settings
from django.db import models


def generate_order_number():
    return f"SC-{uuid.uuid4().hex[:6].upper()}"


def generate_tracking_number():
    return f"SCX-{uuid.uuid4().hex[:8].upper()}"


class Order(models.Model):
    STATUS_CHOICES = [
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("out-for-delivery", "Out for Delivery"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]
    PAYMENT_METHOD_CHOICES = [("card", "Debit Card"), ("transfer", "Bank Transfer"), ("ussd", "USSD")]
    # "stripe" and "paystack" are both wired up at the view/URL layer;
    # "flutterwave" stays in the choices list so existing rows and the
    # (disabled but intact) integration in services_flutterwave.py remain
    # valid if switched back on later.
    PAYMENT_PROVIDER_CHOICES = [("stripe", "Stripe"), ("paystack", "Paystack"), ("flutterwave", "Flutterwave")]
    PAYMENT_STATUS_CHOICES = [("pending", "Pending"), ("paid", "Paid"), ("failed", "Failed"), ("refunded", "Refunded")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=20, unique=True, default=generate_order_number)
    tracking_number = models.CharField(max_length=20, unique=True, default=generate_tracking_number)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="processing")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_provider = models.CharField(max_length=20, choices=PAYMENT_PROVIDER_CHOICES, default="stripe")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending")
    payment_reference = models.CharField(max_length=100, blank=True)

    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)

    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_code = models.CharField(max_length=30, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number

    @property
    def shipping_address_display(self):
        return f"{self.address}, {self.city}, {self.state}"


class OrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("products.Product", on_delete=models.PROTECT, related_name="order_items")
    product_name = models.CharField(max_length=200, help_text="Snapshot at time of purchase")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Snapshot at time of purchase")
    quantity = models.PositiveIntegerField(default=1)
    variant_label = models.CharField(max_length=100, blank=True)

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"


class OrderStatusEvent(models.Model):
    """Timeline entries powering the order tracking page."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_events")
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    note = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.order.order_number} — {self.status}"
