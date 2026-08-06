from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Product

from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete"]
    pagination_class = None

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related("product")

    def create(self, request, *args, **kwargs):
        product_id = request.data.get("product_id")
        product = Product.objects.filter(id=product_id).first()
        if not product:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        item, created = WishlistItem.objects.get_or_create(user=request.user, product=product)
        return Response(
            WishlistItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class WishlistItemByProductView(APIView):
    """Remove a wishlist entry by product_id — convenient since the
    frontend's wishlist store keys entries by product id."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        item = get_object_or_404(WishlistItem, user=request.user, product_id=product_id)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
