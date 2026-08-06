from django.db.models import Avg
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .filters import ProductFilter
from .models import Category, Coupon, Product, Review
from .serializers import (
    CategorySerializer,
    CouponApplySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    ReviewCreateSerializer,
    ReviewSerializer,
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True).order_by("order", "name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    pagination_class = None


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    filterset_class = ProductFilter
    search_fields = ["name", "description"]
    ordering_fields = ["price", "created_at", "avg_rating"]
    lookup_field = "slug"
    pagination_class = None

    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images", "reviews")
        return qs.annotate(avg_rating=Avg("reviews__rating")).order_by("-created_at")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    @action(detail=False, methods=["get"])
    def best_sellers(self, request):
        qs = self.get_queryset().filter(is_best_seller=True)[:8]
        serializer = ProductListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        qs = self.get_queryset().filter(is_featured=True)[:8]
        serializer = ProductListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def related(self, request, slug=None):
        product = self.get_object()
        qs = self.get_queryset().filter(category=product.category).exclude(id=product.id)[:4]
        serializer = ProductListSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class ReviewListCreateView(generics.ListCreateAPIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_serializer_class(self):
        return ReviewCreateSerializer if self.request.method == "POST" else ReviewSerializer

    def get_queryset(self):
        qs = Review.objects.filter(is_approved=True)
        product_slug = self.request.query_params.get("product")
        if product_slug:
            qs = qs.filter(product__slug=product_slug)
        return qs


class ApplyCouponView(generics.GenericAPIView):
    serializer_class = CouponApplySerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon: Coupon = serializer.validated_data["code"]
        return Response({"code": coupon.code, "discount_percent": coupon.discount_percent}, status=status.HTTP_200_OK)
