from django.apps import apps
from django.contrib import admin
from django.contrib.admin.exceptions import AlreadyRegistered
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin

forecasting_app = apps.get_app_config('app_forecasting')

for model in forecasting_app.get_models():
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        pass


# Show the user ID in the admin user list — useful to map Forecast.user_id back
# to a username when debugging via pgAdmin.
User = get_user_model()


class UserAdminWithId(UserAdmin):
    list_display = ("id",) + UserAdmin.list_display


admin.site.unregister(User)
admin.site.register(User, UserAdminWithId)
