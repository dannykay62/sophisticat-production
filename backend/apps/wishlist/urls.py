from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import WishlistItemByProductView, WishlistViewSet

router = DefaultRouter()
router.register("", WishlistViewSet, basename="wishlist")

urlpatterns = [
    path("by-product/<uuid:product_id>/", WishlistItemByProductView.as_view(), name="wishlist-by-product"),
] + router.urls
