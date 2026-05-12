import io
from datetime import datetime

import pandas as pd
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.forecasting.models import Forecast, ForecastRow
from apps.forecasting.pagination import ForecastPagination
from apps.forecasting.serializers import (
    ForecastCreateSerializer,
    ForecastDetailSerializer,
    ForecastListSerializer,
    ForecastRowSerializer,
    ForecastUpdateSerializer,
)


class ForecastViewSet(viewsets.ModelViewSet):
    """API for forecasting sessions.

    Endpoints :
        GET    /api/forecasting/forecasts/                       List user's forecasts
        POST   /api/forecasting/forecasts/                       Upload 2 CSVs + stock_tampon → run pipeline
        GET    /api/forecasting/forecasts/{id}/                  Detail with rows
        DELETE /api/forecasting/forecasts/{id}/                  Delete a forecast (cascade on rows)
        PATCH  /api/forecasting/forecasts/{id}/rows/{row_id}/    Edit supplement_humain on a row
        GET    /api/forecasting/forecasts/{id}/export/?type=csv|xlsx     Download the forecast
    """

    permission_classes = [IsAuthenticated]
    pagination_class = ForecastPagination
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
        if self.action == "partial_update":
            return ForecastUpdateSerializer
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
        # Only the `title` is mutable on a Forecast — other metadata reflects
        # the pipeline run and must stay frozen. Row edits go through
        # /rows/{row_id}/, not here.
        forecast = self.get_object()
        serializer = self.get_serializer(forecast, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            ForecastDetailSerializer(forecast, context={"request": request}).data
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

    @action(detail=True, methods=["get"], url_path="export", url_name="export")
    def export(self, request, pk=None):
        """Download a forecast as CSV or XLSX.

        The query param is named `type` (not `format`) because DRF reserves
        `?format=` for its content-negotiation machinery — using it here would
        make DRF look for a non-existent renderer and raise a misleading 404.

        Mirrors the legacy Tkinter export : 4 columns (DATE, ECOLE, A PREPARER,
        Supplement Humain). CSV uses utf-8-sig so Excel opens it without mojibake.

        Optional filtering / sorting query params — used to export the same
        subset the user sees on the front (search + date range + sort) :
            ?school=alain            (case-insensitive `icontains` on school)
            ?date_from=2025-11-03    (rows where date >= value)
            ?date_to=2025-11-10      (rows where date <= value)
            ?sort_by=date|school     (column to sort by ; default Meta.ordering)
            ?sort_dir=asc|desc       (direction ; default asc, ignored if no sort_by)

        Filenames carry a `_filtre` suffix when any filter is applied, so the
        user can spot non-default exports in their downloads.
        """
        fmt = request.query_params.get("type", "csv").lower()
        if fmt not in ("csv", "xlsx"):
            raise ValidationError(
                {"type": "Type invalide. Utilisez 'csv' ou 'xlsx'."}
            )

        school = request.query_params.get("school", "").strip()
        date_from = self._parse_export_date(request.query_params.get("date_from"), "date_from")
        date_to = self._parse_export_date(request.query_params.get("date_to"), "date_to")
        sort_by = request.query_params.get("sort_by", "").strip()
        sort_dir = request.query_params.get("sort_dir", "asc").strip().lower()

        if sort_by and sort_by not in ("date", "school"):
            raise ValidationError({"sort_by": "Doit être 'date' ou 'school'."})
        if sort_dir not in ("asc", "desc"):
            raise ValidationError({"sort_dir": "Doit être 'asc' ou 'desc'."})

        forecast = self.get_object()
        qs = forecast.rows.all()
        if school:
            qs = qs.filter(school__icontains=school)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)
        if sort_by:
            qs = qs.order_by(f"{'' if sort_dir == 'asc' else '-'}{sort_by}")
        # Sinon, le Meta.ordering = ["date", "school"] s'applique par défaut.

        rows = qs.values("date", "school", "final_amount", "supplement_humain")
        df = pd.DataFrame.from_records(rows)
        if df.empty:
            df = pd.DataFrame(columns=["date", "school", "final_amount", "supplement_humain"])

        df = df.rename(
            columns={
                "date": "DATE",
                "school": "ECOLE",
                "final_amount": "A PREPARER",
                "supplement_humain": "Supplement Humain",
            }
        )
        df["DATE"] = pd.to_datetime(df["DATE"]).dt.date.astype(str)
        df["A PREPARER"] = df["A PREPARER"].fillna(0).astype(int)
        df["Supplement Humain"] = df["Supplement Humain"].fillna(0).astype(int)
        # Colonne dédiée répétée sur chaque ligne : la valeur est la même
        # partout (paramètre global de la prévision), mais en colonne plutôt
        # qu'en ligne séparée, Excel peut filtrer/trier sans la perdre.
        df["Stock tampon"] = int(forecast.stock_tampon)

        is_filtered = bool(school or date_from or date_to or sort_by)
        suffix = "_filtre" if is_filtered else ""
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = f"previsions_repas_{forecast.pk}{suffix}_{stamp}"

        if fmt == "csv":
            content = df.to_csv(index=False).encode("utf-8-sig")
            response = HttpResponse(content, content_type="text/csv; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{base_name}.csv"'
            return response

        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="prévisions", index=False)
        response = HttpResponse(
            buffer.getvalue(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{base_name}.xlsx"'
        return response

    @staticmethod
    def _parse_export_date(raw: str | None, field: str) -> str:
        """Valide qu'une date `YYYY-MM-DD` est bien formée, renvoie "" si vide."""
        value = (raw or "").strip()
        if not value:
            return ""
        try:
            datetime.strptime(value, "%Y-%m-%d")
        except ValueError as exc:
            raise ValidationError({field: "Format attendu : YYYY-MM-DD."}) from exc
        return value
