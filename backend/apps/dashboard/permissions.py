from rest_framework import permissions


class IsStaffUser(permissions.BasePermission):
    """Every view in the admin dashboard API requires a logged-in user with
    `is_staff=True` — the same flag Django admin itself relies on. Staff
    status is granted the same way it always has been: via Django admin
    ('Users' → check 'Staff status') or `createsuperuser`.
    """

    message = "You need staff access to use the admin dashboard."

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
