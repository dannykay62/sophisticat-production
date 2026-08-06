from django.urls import path

from .views import (
    InitializePaymentView,
    OrderDetailView,
    OrderListCreateView,
    OrderTrackingView,
    PaystackWebhookView,
    StripeWebhookView,
    VerifyPaymentView,
)

# Uncomment alongside the corresponding view in views.py to switch
# Flutterwave back on:
# from .views import FlutterwaveWebhookView

urlpatterns = [
    path("", OrderListCreateView.as_view(), name="order-list-create"),
    path("verify-payment/", VerifyPaymentView.as_view(), name="order-verify-payment"),
    path("webhook/stripe/", StripeWebhookView.as_view(), name="order-stripe-webhook"),
    path("webhook/paystack/", PaystackWebhookView.as_view(), name="order-paystack-webhook"),
    # path("webhook/flutterwave/", FlutterwaveWebhookView.as_view(), name="order-flutterwave-webhook"),
    path("track/<str:order_number>/", OrderTrackingView.as_view(), name="order-track"),
    path("<str:order_number>/initialize-payment/", InitializePaymentView.as_view(), name="order-initialize-payment"),
    path("<str:order_number>/", OrderDetailView.as_view(), name="order-detail"),
]
