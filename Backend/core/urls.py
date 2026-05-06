from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static

from core import settings

urlpatterns = [

    path('admin/', admin.site.urls),

    path("api/auth/", include("apps.authentication.urls")),

    path("api/forecasting/", include("apps.forecasting.urls")),

]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
