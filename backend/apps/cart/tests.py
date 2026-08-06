"""
Test suite for the cart API.

The cart app previously shipped with zero test coverage, which is how two
bugs made it to a "final" build undetected:
  1. CartItemSerializer.image was a SerializerMethodField with no get_image()
     method, so every cart request (GET/POST/PATCH/DELETE) raised
     AttributeError and 500'd.
  2. CartItemDetailView looked up items with CartItem.objects.get(...)
     instead of get_object_or_404, so a missing/foreign item 500'd instead
     of returning a clean 404.

Run with:
    python manage.py test apps.cart --settings=sophisticat.settings_test
"""

import uuid
from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.products.models import Category, Product, ProductImage

from .models import Cart, CartItem


def make_product(name="Gold Signet Ring", slug="gold-signet-ring", price="45000.00", stock=10, with_image=False):
    category, _ = Category.objects.get_or_create(name="Rings", slug="rings")
    product = Product.objects.create(
        name=name, slug=slug, category=category, price=Decimal(price), stock_quantity=stock,
    )
    if with_image:
        ProductImage.objects.create(product=product, image="products/ring.jpg", order=0)
    return product


class CartTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="amara@example.com", email="amara@example.com", password="testpass123")
        self.client.force_authenticate(user=self.user)

    def test_get_empty_cart(self):
        response = self.client.get(reverse("cart-detail"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])
        self.assertEqual(response.data["total"], 0)

    def test_add_item_returns_200_not_500(self):
        """Regression test for the missing get_image() crash."""
        product = make_product()
        response = self.client.post(reverse("cart-detail"), {"product_id": str(product.id), "quantity": 2}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["quantity"], 2)
        self.assertIsNone(response.data["items"][0]["image"])

    def test_add_item_without_image_returns_null_image(self):
        product = make_product(with_image=False)
        response = self.client.post(reverse("cart-detail"), {"product_id": str(product.id), "quantity": 1}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(response.data["items"][0]["image"])

    def test_add_item_with_image_returns_absolute_url(self):
        product = make_product(with_image=True)
        response = self.client.post(reverse("cart-detail"), {"product_id": str(product.id), "quantity": 1}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        image_url = response.data["items"][0]["image"]
        self.assertIsNotNone(image_url)
        self.assertTrue(image_url.startswith("http"), image_url)

    def test_adding_same_product_twice_increments_quantity(self):
        product = make_product()
        self.client.post(reverse("cart-detail"), {"product_id": str(product.id), "quantity": 1}, format="json")
        response = self.client.post(reverse("cart-detail"), {"product_id": str(product.id), "quantity": 2}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data["items"]), 1)
        self.assertEqual(response.data["items"][0]["quantity"], 3)

    def test_patch_item_by_id(self):
        product = make_product()
        cart, _ = Cart.objects.get_or_create(user=self.user)
        item = CartItem.objects.create(cart=cart, product=product, quantity=1)
        response = self.client.patch(
            reverse("cart-item-detail", args=[item.id]), {"quantity": 5}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        item.refresh_from_db()
        self.assertEqual(item.quantity, 5)

    def test_patch_missing_item_returns_404_not_500(self):
        """Regression test for CartItemDetailView.get_item using .get() instead of get_object_or_404."""
        response = self.client.patch(
            reverse("cart-item-detail", args=[uuid.uuid4()]), {"quantity": 1}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_missing_item_returns_404_not_500(self):
        response = self.client.delete(reverse("cart-item-detail", args=[uuid.uuid4()]))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_patch_another_users_item(self):
        other_user = User.objects.create_user(username="other@example.com", email="other@example.com", password="testpass123")
        other_cart, _ = Cart.objects.get_or_create(user=other_user)
        product = make_product()
        other_item = CartItem.objects.create(cart=other_cart, product=product, quantity=1)

        response = self.client.patch(
            reverse("cart-item-detail", args=[other_item.id]), {"quantity": 9}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_item_by_product_id(self):
        product = make_product()
        self.client.post(reverse("cart-detail"), {"product_id": str(product.id), "quantity": 1}, format="json")
        response = self.client.delete(reverse("cart-item-by-product", args=[product.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])

    def test_clear_cart(self):
        product = make_product()
        self.client.post(reverse("cart-detail"), {"product_id": str(product.id), "quantity": 1}, format="json")
        response = self.client.delete(reverse("cart-detail"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["items"], [])

    def test_unauthenticated_request_rejected(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse("cart-detail"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
