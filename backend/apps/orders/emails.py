"""
Transactional emails for the order lifecycle: order confirmation (sent once,
the moment payment clears) and shipping status updates (sent whenever an
admin adds a new OrderStatusEvent for shipped / out-for-delivery / delivered
/ cancelled).

Each email is sent as HTML with a plain-text alternative for clients that
prefer it. `fail_silently=False` + logging everywhere: a broken SMTP config
should never take down checkout or the admin's order-status update, but it
needs to be loud in logs/monitoring rather than silently swallowed.
"""

import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)

STATUS_MESSAGES = {
    "shipped": "Your order is on its way.",
    "out-for-delivery": "Your order is out for delivery — it should arrive today.",
    "delivered": "Your order has been delivered.",
    "cancelled": "Your order has been cancelled.",
}


def _naira(amount) -> str:
    return f"₦{amount:,.0f}"


def _tracking_url(order) -> str:
    return f"{settings.FRONTEND_URL}/track-order?order={order.order_number}"


def _send(*, subject: str, text_body: str, html_body: str, to: str) -> None:
    try:
        message = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to],
        )
        message.attach_alternative(html_body, "text/html")
        message.send(fail_silently=False)
    except Exception:
        # Don't let a broken email provider break checkout or admin actions —
        # log it loudly so it shows up in monitoring instead.
        logger.exception("Failed to send order email %r to %s", subject, to)


def send_order_confirmation_email(order) -> None:
    items = list(order.items.all())

    # -- Plain-text body --
    lines = [f"Hi {order.full_name},", "", "Thanks for your order — we've received it and payment has cleared.", ""]
    lines.append(f"Order number: {order.order_number}")
    lines.append(f"Tracking number: {order.tracking_number}")
    lines.append("")
    lines.append("Items:")
    for item in items:
        variant = f" ({item.variant_label})" if item.variant_label else ""
        lines.append(f"  - {item.quantity} x {item.product_name}{variant} — {_naira(item.line_total)}")
    lines.append("")
    lines.append(f"Subtotal: {_naira(order.subtotal)}")
    if order.discount:
        lines.append(f"Discount: -{_naira(order.discount)}")
    lines.append(f"Shipping: {_naira(order.shipping_fee)}")
    lines.append(f"Total: {_naira(order.total)}")
    lines.append("")
    lines.append(f"Shipping to: {order.shipping_address_display}")
    lines.append("")
    lines.append(f"Track your order any time: {_tracking_url(order)}")
    lines.append("")
    lines.append("— Sophisticat")

    # -- HTML body --
    order.subtotal_display = _naira(order.subtotal)
    order.discount_display = _naira(order.discount)
    order.shipping_fee_display = _naira(order.shipping_fee)
    order.total_display = _naira(order.total)
    items_ctx = [
        {
            "quantity": item.quantity,
            "product_name": item.product_name,
            "variant_label": item.variant_label,
            "line_total_display": _naira(item.line_total),
        }
        for item in items
    ]
    html_body = render_to_string(
        "emails/order_confirmation.html",
        {"order": order, "items": items_ctx, "tracking_url": _tracking_url(order)},
    )

    _send(
        subject=f"Order Confirmed — {order.order_number}",
        text_body="\n".join(lines),
        html_body=html_body,
        to=order.email,
    )


def send_shipping_update_email(status_event) -> None:
    order = status_event.order
    headline = STATUS_MESSAGES.get(status_event.status)
    if headline is None:
        # "processing" is handled by send_order_confirmation_email; nothing
        # further to send for that status.
        return

    # -- Plain-text body --
    lines = [f"Hi {order.full_name},", "", headline, ""]
    lines.append(f"Order number: {order.order_number}")
    lines.append(f"Tracking number: {order.tracking_number}")
    if status_event.note:
        lines.append("")
        lines.append(status_event.note)
    lines.append("")
    lines.append(f"Track your order any time: {_tracking_url(order)}")
    lines.append("")
    lines.append("— Sophisticat")

    # -- HTML body --
    html_body = render_to_string(
        "emails/shipping_update.html",
        {
            "order": order,
            "status_label": order.get_status_display(),
            "headline": headline,
            "note": status_event.note,
            "tracking_url": _tracking_url(order),
        },
    )

    _send(
        subject=f"Order Update — {order.order_number} is {order.get_status_display()}",
        text_body="\n".join(lines),
        html_body=html_body,
        to=order.email,
    )
