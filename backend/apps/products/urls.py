from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ApplyCouponView, CategoryViewSet, ProductViewSet, ReviewListCreateView

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("products", ProductViewSet, basename="product")

urlpatterns = [
    path("reviews/", ReviewListCreateView.as_view(), name="review-list-create"),
    path("coupons/apply/", ApplyCouponView.as_view(), name="coupon-apply"),
    path("", include(router.urls)),
]
