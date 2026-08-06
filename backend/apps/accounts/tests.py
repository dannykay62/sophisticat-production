"""
Test suite for authentication: registration, login, rate limiting on the
sensitive endpoints, and the password-reset flow (request + confirm).

Run with:
    python manage.py test apps.accounts --settings=sophisticat.settings_test
"""

from django.core import mail
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class RegistrationTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_register_creates_user_and_returns_tokens(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "amara@example.com",
                "full_name": "Amara Nwosu",
                "password": "a-strong-password-1",
                "confirm_password": "a-strong-password-1",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertTrue(User.objects.filter(email="amara@example.com").exists())

    def test_register_rejects_mismatched_passwords(self):
        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "amara@example.com",
                "full_name": "Amara Nwosu",
                "password": "a-strong-password-1",
                "confirm_password": "does-not-match",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(email="amara@example.com").exists())

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(username="amara@example.com", email="amara@example.com", password="whatever123")
        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "amara@example.com",
                "full_name": "Amara Nwosu",
                "password": "a-strong-password-1",
                "confirm_password": "a-strong-password-1",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_is_throttled_after_10_per_hour(self):
        for i in range(10):
            response = self.client.post(
                reverse("auth-register"),
                {
                    "email": f"user{i}@example.com",
                    "full_name": "Test User",
                    "password": "a-strong-password-1",
                    "confirm_password": "a-strong-password-1",
                },
            )
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        response = self.client.post(
            reverse("auth-register"),
            {
                "email": "one-too-many@example.com",
                "full_name": "Test User",
                "password": "a-strong-password-1",
                "confirm_password": "a-strong-password-1",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class LoginTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="chidi@example.com", email="chidi@example.com", password="correct-password-1"
        )

    def test_login_succeeds_with_correct_credentials(self):
        response = self.client.post(
            reverse("auth-login"), {"email": "chidi@example.com", "password": "correct-password-1"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["email"], "chidi@example.com")

    def test_login_fails_with_wrong_password(self):
        response = self.client.post(reverse("auth-login"), {"email": "chidi@example.com", "password": "wrong"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_is_throttled_after_10_per_minute(self):
        """auth-login is scoped to 10/minute — brute-forcing a password
        should get cut off well before 10 attempts do any real damage."""
        statuses = []
        for _ in range(11):
            response = self.client.post(reverse("auth-login"), {"email": "chidi@example.com", "password": "wrong"})
            statuses.append(response.status_code)

        self.assertTrue(all(s == status.HTTP_401_UNAUTHORIZED for s in statuses[:10]), statuses)
        self.assertEqual(statuses[10], status.HTTP_429_TOO_MANY_REQUESTS, statuses)


class PasswordResetTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="ngozi@example.com", email="ngozi@example.com", password="old-password-1", first_name="Ngozi"
        )

    def test_request_for_existing_email_sends_email(self):
        response = self.client.post(reverse("auth-password-reset"), {"email": "ngozi@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Reset", mail.outbox[0].subject)
        self.assertIn("ngozi@example.com", mail.outbox[0].to)

    def test_request_for_unknown_email_still_returns_200_and_sends_nothing(self):
        """Doesn't leak whether an email is registered — same 200 response,
        no email actually sent."""
        response = self.client.post(reverse("auth-password-reset"), {"email": "nobody@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_confirm_with_valid_token_changes_password(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        response = self.client.post(
            reverse("auth-password-reset-confirm"),
            {"uid": uid, "token": token, "new_password": "brand-new-password-1"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("brand-new-password-1"))

    def test_confirm_with_invalid_token_is_rejected(self):
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))

        response = self.client.post(
            reverse("auth-password-reset-confirm"),
            {"uid": uid, "token": "not-a-real-token", "new_password": "brand-new-password-1"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("old-password-1"))

    def test_confirm_with_garbage_uid_is_rejected_not_500(self):
        response = self.client.post(
            reverse("auth-password-reset-confirm"),
            {"uid": "not-valid-base64!!!", "token": "anything", "new_password": "brand-new-password-1"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_request_is_throttled_after_5_per_hour(self):
        for _ in range(5):
            response = self.client.post(reverse("auth-password-reset"), {"email": "ngozi@example.com"})
            self.assertNotEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

        response = self.client.post(reverse("auth-password-reset"), {"email": "ngozi@example.com"})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_reset_email_content_and_html_alternative(self):
        self.client.post(reverse("auth-password-reset"), {"email": "ngozi@example.com"})
        sent = mail.outbox[0]
        self.assertIn("Ngozi", sent.body)
        self.assertIn("/reset-password?uid=", sent.body)
        self.assertEqual(len(sent.alternatives), 1)
        html_body, mimetype = sent.alternatives[0]
        self.assertEqual(mimetype, "text/html")
        self.assertIn("Reset Your Password", html_body)

    def test_reset_email_failure_does_not_break_the_request(self):
        """A broken SMTP config must not turn into a 500 for the customer —
        the endpoint should still return its generic 200 either way."""
        from unittest.mock import patch

        with patch("apps.accounts.emails.EmailMultiAlternatives.send", side_effect=Exception("SMTP is down")):
            response = self.client.post(reverse("auth-password-reset"), {"email": "ngozi@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class ChangePasswordTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="tunde@example.com", email="tunde@example.com", password="old-password-1"
        )
        self.client.force_authenticate(user=self.user)

    def test_change_password_with_correct_current_password(self):
        response = self.client.post(
            reverse("auth-change-password"),
            {"current_password": "old-password-1", "new_password": "new-password-1"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-password-1"))

    def test_change_password_rejects_wrong_current_password(self):
        response = self.client.post(
            reverse("auth-change-password"),
            {"current_password": "totally-wrong", "new_password": "new-password-1"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("old-password-1"))

    def test_change_password_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            reverse("auth-change-password"),
            {"current_password": "old-password-1", "new_password": "new-password-1"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
