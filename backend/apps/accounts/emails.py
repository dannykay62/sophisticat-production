import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_password_reset_email(user, reset_url: str) -> None:
    first_name = user.first_name or user.email
    text_body = (
        f"Hi {first_name},\n\n"
        "We received a request to reset your Sophisticat password. "
        f"Click the link below to choose a new one:\n\n{reset_url}\n\n"
        "If you didn't request this, you can safely ignore this email — "
        "your password won't be changed.\n\n"
        "This link expires soon for your security.\n\n"
        "— Sophisticat"
    )
    html_body = render_to_string(
        "emails/password_reset.html",
        {"first_name": first_name, "reset_url": reset_url},
    )
    try:
        message = EmailMultiAlternatives(
            subject="Reset your Sophisticat password",
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
    except Exception:
        # Don't let a broken email provider turn into a 500 for the user —
        # the endpoint still returns its generic "check your email" response
        # either way, but this needs to be loud in logs/monitoring.
        logger.exception("Failed to send password reset email to %s", user.email)
