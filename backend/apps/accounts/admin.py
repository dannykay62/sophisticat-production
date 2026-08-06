from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Address, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "full_name", "phone", "is_staff", "is_active", "created_at"]
    list_filter = ["is_staff", "is_active", "notify_promotions"]
    search_fields = ["email", "first_name", "last_name", "phone"]
    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone", "date_of_birth")}),
        (
            "Notification preferences",
            {"fields": ("notify_order_updates", "notify_promotions", "notify_new_arrivals")},
        ),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "username", "password1", "password2")}),
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["label", "full_name", "user", "city", "state", "is_default"]
    list_filter = ["state", "is_default"]
    search_fields = ["full_name", "user__email", "city"]
