from django.contrib import admin
from django.contrib.admin.exceptions import AlreadyRegistered
from django.apps import apps

forecasting_app = apps.get_app_config('app_forecasting')

for model in forecasting_app.get_models():
    try:
        admin.site.register(model)
    except AlreadyRegistered:
        pass
