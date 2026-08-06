from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.orders'

    def ready(self):
        from sophisticat.admin_dashboard import install_dashboard_stats

        install_dashboard_stats()
