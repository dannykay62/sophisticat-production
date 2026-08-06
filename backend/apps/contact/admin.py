from django.contrib import admin

from .models import ContactMessage, NewsletterSubscriber


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "subject", "is_resolved", "created_at"]
    list_filter = ["is_resolved"]
    list_editable = ["is_resolved"]
    search_fields = ["name", "email", "subject", "message"]


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "subscribed_at"]
    search_fields = ["email"]
