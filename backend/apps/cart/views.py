from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Coupon, Product

from .models import Cart, CartItem
from .serializers import AddCartItemSerializer, CartSerializer, UpdateCartItemSerializer


class CartView(APIView):
    """GET returns the current user's cart (creating an empty one if needed).
    POST adds an item. DELETE clears the cart."""

    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    def get(self, request):
        cart = self.get_cart(request)
        return Response(CartSerializer(cart, context={"request": request}).data)

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = self.get_cart(request)
        product = Product.objects.get(id=serializer.validated_data["product_id"])
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant_label=serializer.validated_data.get("variant_label", ""),
            defaults={"quantity": serializer.validated_data["quantity"]},
        )
        if not created:
            item.quantity += serializer.validated_data["quantity"]
            item.save(update_fields=["quantity"])
        return Response(CartSerializer(cart, context={"request": request}).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        cart = self.get_cart(request)
        cart.items.all().delete()
        cart.coupon_code = ""
        cart.save(update_fields=["coupon_code"])
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_item(self, request, item_id):
        return get_object_or_404(CartItem, id=item_id, cart__user=request.user)

    def patch(self, request, item_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.get_item(request, item_id)
        item.quantity = serializer.validated_data["quantity"]
        item.save(update_fields=["quantity"])
        return Response(CartSerializer(item.cart, context={"request": request}).data)

    def delete(self, request, item_id):
        item = self.get_item(request, item_id)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartItemByProductView(APIView):
    """Update/remove a cart line by product_id — convenient since the
    frontend's cart store keys lines by product id, not the cart item's own id."""

    permission_classes = [permissions.IsAuthenticated]

    def get_item(self, request, product_id):
        return get_object_or_404(CartItem, cart__user=request.user, product_id=product_id)

    def patch(self, request, product_id):
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = self.get_item(request, product_id)
        item.quantity = serializer.validated_data["quantity"]
        item.save(update_fields=["quantity"])
        return Response(CartSerializer(item.cart, context={"request": request}).data)

    def delete(self, request, product_id):
        item = self.get_item(request, product_id)
        cart = item.cart
        item.delete()
        return Response(CartSerializer(cart, context={"request": request}).data)


class CartApplyCouponView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get("code", "").strip().upper()
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response({"detail": "That coupon code doesn't exist."}, status=status.HTTP_400_BAD_REQUEST)
        if not coupon.is_valid():
            return Response({"detail": "That coupon code has expired."}, status=status.HTTP_400_BAD_REQUEST)

        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.coupon_code = coupon.code
        cart.save(update_fields=["coupon_code"])
        return Response(CartSerializer(cart, context={"request": request}).data)
