from django.urls import path

from .views import CartApplyCouponView, CartItemByProductView, CartItemDetailView, CartView

urlpatterns = [
    path("", CartView.as_view(), name="cart-detail"),
    path("items/<uuid:item_id>/", CartItemDetailView.as_view(), name="cart-item-detail"),
    path("items/by-product/<uuid:product_id>/", CartItemByProductView.as_view(), name="cart-item-by-product"),
    path("apply-coupon/", CartApplyCouponView.as_view(), name="cart-apply-coupon"),
]
