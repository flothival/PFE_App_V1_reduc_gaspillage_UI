from rest_framework.routers import DefaultRouter

from apps.forecasting.viewsets import ForecastViewSet

router = DefaultRouter()
router.register(r"forecasts", ForecastViewSet, basename="forecast")

urlpatterns = router.urls
