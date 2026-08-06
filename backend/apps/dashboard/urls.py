from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("products", views.AdminProductViewSet, basename="admin-products")
router.register("categories", views.AdminCategoryViewSet, basename="admin-categories")
router.register("orders", views.AdminOrderViewSet, basename="admin-orders")
router.register("blog-posts", views.AdminBlogPostViewSet, basename="admin-blog-posts")
router.register("coupons", views.AdminCouponViewSet, basename="admin-coupons")
router.register("messages", views.AdminContactMessageViewSet, basename="admin-messages")
router.register("newsletter", views.AdminNewsletterViewSet, basename="admin-newsletter")
router.register("reviews", views.AdminReviewViewSet, basename="admin-reviews")
router.register("customers", views.AdminUserViewSet, basename="admin-customers")

urlpatterns = [
    path("stats/", views.StatsView.as_view(), name="admin-stats"),
    path("", include(router.urls)),
]
