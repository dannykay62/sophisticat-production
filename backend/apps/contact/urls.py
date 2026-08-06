from django.urls import path

from .views import ContactMessageCreateView, NewsletterSubscribeView

urlpatterns = [
    path("", ContactMessageCreateView.as_view(), name="contact-create"),
    path("newsletter/", NewsletterSubscribeView.as_view(), name="newsletter-subscribe"),
]
