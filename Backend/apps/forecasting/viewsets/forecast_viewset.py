from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.forecasting.models import Forecast, ForecastRow
from apps.forecasting.serializers import (
    ForecastCreateSerializer,
    ForecastDetailSerializer,
    ForecastListSerializer,
    ForecastRowSerializer,
)


class ForecastViewSet(viewsets.ModelViewSet):
    """API for forecasting sessions.

    Endpoints :
        GET    /api/forecasting/forecasts/                       List user's forecasts
        POST   /api/forecasting/forecasts/                       Upload 2 CSVs + stock_tampon → run pipeline
        GET    /api/forecasting/forecasts/{id}/                  Detail with rows
        DELETE /api/forecasting/forecasts/{id}/                  Delete a forecast (cascade on rows)
        PATCH  /api/forecasting/forecasts/{id}/rows/{row_id}/    Edit supplement_humain on a row
    """

    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return (
            Forecast.objects.filter(user=self.request.user).prefetch_related("rows")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ForecastCreateSerializer
        if self.action == "retrieve":
            return ForecastDetailSerializer
        return ForecastListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        forecast = serializer.save()
        return Response(
            ForecastDetailSerializer(forecast, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def partial_update(self, request, *args, **kwargs):
        # Forecast metadata is immutable — use the rows endpoint to edit lines.
        return Response(
            {"detail": "Method not allowed. Use /rows/{row_id}/ to edit a forecast row."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(
        detail=True,
        methods=["patch"],
        url_path=r"rows/(?P<row_pk>[^/.]+)",
        url_name="row-update",
    )
    def update_row(self, request, pk=None, row_pk=None):
        forecast = self.get_object()  # enforces user filter via get_queryset()
        row = get_object_or_404(ForecastRow, pk=row_pk, forecast=forecast)
        serializer = ForecastRowSerializer(row, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
