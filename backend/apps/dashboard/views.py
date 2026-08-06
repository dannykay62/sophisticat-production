from datetime import timedelta

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.blog.models import BlogPost
from apps.contact.models import ContactMessage, NewsletterSubscriber
from apps.orders.models import Order, OrderStatusEvent
from apps.products.models import Category, Coupon, Product, ProductImage, Review

from .permissions import IsStaffUser
from .serializers import (
    AdminBlogPostSerializer,
    AdminCategorySerializer,
    AdminContactMessageSerializer,
    AdminCouponSerializer,
    AdminNewsletterSubscriberSerializer,
    AdminOrderDetailSerializer,
    AdminOrderListSerializer,
    AdminOrderStatusUpdateSerializer,
    AdminProductDetailSerializer,
    AdminProductImageSerializer,
    AdminProductListSerializer,
    AdminReviewSerializer,
    AdminUserSerializer,
)

User = get_user_model()


class StatsView(generics.GenericAPIView):
    """Summary numbers + a 14-day revenue series for the dashboard home."""

    permission_classes = [IsStaffUser]

    def get(self, request):
        orders_qs = Order.objects.all()
        paid_orders = orders_qs.filter(payment_status="paid")

        today = timezone.now().date()
        since = today - timedelta(days=13)
        daily = (
            paid_orders.filter(created_at__date__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total"), orders=Count("id"))
            .order_by("day")
        )
        by_day = {str(row["day"]): {"revenue": float(row["revenue"] or 0), "orders": row["orders"]} for row in daily}
        revenue_series = []
        for i in range(14):
            day = since + timedelta(days=i)
            key = str(day)
            entry = by_day.get(key, {"revenue": 0, "orders": 0})
            revenue_series.append({"date": key, **entry})

        top_products = (
            Product.objects.filter(is_active=True)
            .annotate(units_sold=Sum("order_items__quantity"))
            .order_by("-units_sold")
            .values("id", "name", "slug", "units_sold")[:5]
        )

        return Response(
            {
                "total_products": Product.objects.filter(is_active=True).count(),
                "featured_products": Product.objects.filter(is_active=True, is_featured=True).count(),
                "total_orders": orders_qs.count(),
                "processing_orders": orders_qs.filter(status="processing").count(),
                "total_revenue": float(paid_orders.aggregate(total=Sum("total"))["total"] or 0),
                "total_customers": User.objects.filter(is_staff=False).count(),
                "unread_messages": ContactMessage.objects.filter(is_resolved=False).count(),
                "low_stock": Product.objects.filter(is_active=True, stock_quantity__lte=10).count(),
                "pending_reviews": Review.objects.filter(is_approved=False).count(),
                "newsletter_subscribers": NewsletterSubscriber.objects.count(),
                "revenue_series": revenue_series,
                "top_products": [
                    {"id": str(p["id"]), "name": p["name"], "slug": p["slug"], "units_sold": p["units_sold"] or 0}
                    for p in top_products
                ],
            }
        )


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("order", "name")
    serializer_class = AdminCategorySerializer
    permission_classes = [IsStaffUser]
    lookup_field = "id"
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "slug"]


class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related("category").prefetch_related("images", "variants")
    permission_classes = [IsStaffUser]
    lookup_field = "id"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "sku", "description"]
    ordering_fields = ["created_at", "price", "stock_quantity", "name"]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get("category")
        is_active = self.request.query_params.get("is_active")
        low_stock = self.request.query_params.get("low_stock")
        featured = self.request.query_params.get("featured")
        if category:
            qs = qs.filter(category__slug=category)
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ("1", "true", "yes"))
        if low_stock is not None:
            qs = qs.filter(stock_quantity__lte=10)
        if featured is not None:
            qs = qs.filter(is_featured=featured.lower() in ("1", "true", "yes"))
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return AdminProductListSerializer
        return AdminProductDetailSerializer

    @action(detail=True, methods=["post"])
    def toggle_featured(self, request, id=None):
        product = self.get_object()
        product.is_featured = not product.is_featured
        product.save(update_fields=["is_featured", "updated_at"])
        return Response(AdminProductDetailSerializer(product, context={"request": request}).data)

    @action(detail=True, methods=["post"], serializer_class=AdminProductImageSerializer)
    def upload_image(self, request, id=None):
        product = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>[^/.]+)")
    def delete_image(self, request, id=None, image_id=None):
        product = self.get_object()
        deleted, _ = ProductImage.objects.filter(product=product, id=image_id).delete()
        if not deleted:
            return Response({"detail": "Image not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminOrderViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Order.objects.all().select_related("user").prefetch_related("items", "status_events")
    permission_classes = [IsStaffUser]
    lookup_field = "id"
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["order_number", "tracking_number", "full_name", "email"]
    ordering_fields = ["created_at", "total"]

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        payment_status = self.request.query_params.get("payment_status")
        if status_param:
            qs = qs.filter(status=status_param)
        if payment_status:
            qs = qs.filter(payment_status=payment_status)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return AdminOrderListSerializer
        return AdminOrderDetailSerializer

    @action(detail=True, methods=["patch"], serializer_class=AdminOrderStatusUpdateSerializer)
    def update_status(self, request, id=None):
        order = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if "status" in data:
            order.status = data["status"]
        if "payment_status" in data:
            order.payment_status = data["payment_status"]
        order.save(update_fields=["status", "payment_status", "updated_at"])

        if "status" in data:
            OrderStatusEvent.objects.create(order=order, status=data["status"], note=data.get("note", ""))

        return Response(AdminOrderDetailSerializer(order, context={"request": request}).data)


class AdminBlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all()
    serializer_class = AdminBlogPostSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "id"
    filter_backends = [filters.SearchFilter]
    search_fields = ["title", "category"]


class AdminCouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by("-valid_from")
    serializer_class = AdminCouponSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "id"
    pagination_class = None
    filter_backends = [filters.SearchFilter]
    search_fields = ["code"]


class AdminContactMessageViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = ContactMessage.objects.all()
    serializer_class = AdminContactMessageSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "id"
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "email", "subject"]

    def get_queryset(self):
        qs = super().get_queryset()
        is_resolved = self.request.query_params.get("is_resolved")
        if is_resolved is not None:
            qs = qs.filter(is_resolved=is_resolved.lower() in ("1", "true", "yes"))
        return qs


class AdminNewsletterViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NewsletterSubscriber.objects.all()
    serializer_class = AdminNewsletterSubscriberSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "id"


class AdminReviewViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "patch", "delete", "head", "options"]
    queryset = Review.objects.all().select_related("product", "user")
    serializer_class = AdminReviewSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "id"

    def get_queryset(self):
        qs = super().get_queryset()
        is_approved = self.request.query_params.get("is_approved")
        if is_approved is not None:
            qs = qs.filter(is_approved=is_approved.lower() in ("1", "true", "yes"))
        return qs


class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsStaffUser]
    lookup_field = "id"
    filter_backends = [filters.SearchFilter]
    search_fields = ["email", "first_name", "last_name"]
