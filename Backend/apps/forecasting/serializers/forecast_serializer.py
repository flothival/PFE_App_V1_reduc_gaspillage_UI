import io
import logging

from django.db import transaction
from rest_framework import serializers

logger = logging.getLogger(__name__)

from apps.forecasting.models import Forecast, ForecastRow
from apps.forecasting.services.io_utils import (
    MissingCsvColumnError,
    load_future_reservations_csv,
    load_history_csv,
)
from apps.forecasting.services.pipeline import run_forecast_pipeline
from apps.forecasting.services.quota import (
    MAX_STORAGE_BYTES_PER_USER,
    get_user_storage_used,
)

from .forecast_row_serializer import ForecastRowSerializer


# Taille max d'un CSV uploadé
MAX_CSV_SIZE_BYTES = 50 * 1024 * 1024  # 50 Mo


def _validate_csv_size(file_field):
    """Refuse les CSVs > 50 Mo avec un message lisible côté front."""
    if file_field.size > MAX_CSV_SIZE_BYTES:
        size_mb = file_field.size / (1024 * 1024)
        raise serializers.ValidationError(
            f"Le fichier dépasse la taille maximale autorisée (50 Mo). "
            f"Taille reçue : {size_mb:.1f} Mo."
        )


def _validate_csv_columns(file_field, loader_fn):
    """Read the file, parse the CSV, and verify required columns are present.

    Materialises the bytes and resets the cursor so create() can re-read them.
    Raises ValidationError with a human-readable message if a column is missing
    or if the file is unparsable.
    """
    raw = file_field.read()
    file_field.seek(0)
    try:
        loader_fn(io.BytesIO(raw))
    except MissingCsvColumnError as exc:
        raise serializers.ValidationError(str(exc))
    except Exception as exc:
        raise serializers.ValidationError(
            f"Impossible de lire le fichier CSV : {exc}"
        )


class ForecastListSerializer(serializers.ModelSerializer):
    """Light serializer for list views — no nested rows to keep payload small."""

    rows_count = serializers.IntegerField(source="rows.count", read_only=True)

    class Meta:
        model = Forecast
        fields = [
            "id",
            "title",
            "created_at",
            "status",
            "history_filename",
            "future_filename",
            "stock_tampon",
            "predict_start",
            "predict_end",
            "tuning_metrics",
            "rows_count",
        ]
        read_only_fields = fields


class ForecastDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail views — includes all rows."""

    rows = ForecastRowSerializer(many=True, read_only=True)

    class Meta:
        model = Forecast
        fields = [
            "id",
            "title",
            "created_at",
            "status",
            "history_filename",
            "future_filename",
            "stock_tampon",
            "tuning_cfg",
            "tuning_metrics",
            "predict_start",
            "predict_end",
            "error_message",
            "rows",
        ]
        read_only_fields = fields


class ForecastUpdateSerializer(serializers.ModelSerializer):
    """Serializer for PATCH /forecasts/{id}/ — only the title is mutable."""

    class Meta:
        model = Forecast
        fields = ["title"]

    def validate_title(self, value):
        return value.strip()


class ForecastCreateSerializer(serializers.Serializer):
    """Serializer for the upload endpoint.

    Receives the 2 CSV files + stock_tampon, runs the forecasting pipeline,
    creates the Forecast row and bulk-creates the ForecastRow children.
    """

    history_file = serializers.FileField(write_only=True)
    future_file = serializers.FileField(write_only=True)
    stock_tampon = serializers.IntegerField(default=250, min_value=0)
    title = serializers.CharField(
        required=False, allow_blank=True, max_length=255, default=""
    )

    def validate_history_file(self, value):
        if not value.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Le fichier doit être un CSV (.csv).")
        _validate_csv_size(value)
        _validate_csv_columns(value, load_history_csv)
        return value

    def validate_future_file(self, value):
        if not value.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Le fichier doit être un CSV (.csv).")
        _validate_csv_size(value)
        _validate_csv_columns(value, load_future_reservations_csv)
        return value

    def validate_title(self, value):
        return value.strip()

    def validate(self, attrs):
        """Vérifie que la création ne fait pas dépasser le quota de stockage.
        """
        history = attrs["history_file"]
        future = attrs["future_file"]
        new_bytes = history.size + future.size

        user = self.context["request"].user
        used = get_user_storage_used(user)

        if used + new_bytes > MAX_STORAGE_BYTES_PER_USER:
            used_mb = used / (1024 * 1024)
            new_mb = new_bytes / (1024 * 1024)
            max_mb = MAX_STORAGE_BYTES_PER_USER / (1024 * 1024)
            raise serializers.ValidationError(
                {
                    "detail": (
                        f"Quota de stockage dépassé : vous utilisez actuellement "
                        f"{used_mb:.1f} Mo sur {max_mb:.0f} Mo, et cette prévision "
                        f"ajouterait {new_mb:.1f} Mo. Supprimez d'anciennes "
                        f"prévisions pour libérer de l'espace."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        history_file = validated_data["history_file"]
        future_file = validated_data["future_file"]
        stock_tampon = validated_data["stock_tampon"]
        title = validated_data.get("title", "").strip()
        user = self.context["request"].user

        # Auto-numérotation : "Prévision N" où N = (nb total de prévisions
        # de l'utilisateur) + 1. Basé sur le compteur global plutôt que sur
        # l'ID pour éviter les sauts visibles après suppression.
        if not title:
            title = f"Prévision {Forecast.objects.filter(user=user).count() + 1}"

        history_file.seek(0)
        history_bytes = history_file.read()
        future_file.seek(0)
        future_bytes = future_file.read()

        logger.info(
            "Lancement du pipeline — user_id=%s history=%s future=%s stock_tampon=%d",
            user.id, history_file.name, future_file.name, stock_tampon,
        )
        try:
            result = run_forecast_pipeline(
                history_source=io.BytesIO(history_bytes),
                future_source=io.BytesIO(future_bytes),
                stock_tampon=stock_tampon,
            )
        except Exception as exc:
            logger.exception("Échec du pipeline — user_id=%s : %s", user.id, exc)
            raise serializers.ValidationError(
                {"detail": f"Échec du pipeline de prévision : {exc}"}
            )

        with transaction.atomic():
            forecast = Forecast.objects.create(
                user=user,
                title=title,
                status=Forecast.Status.DONE,
                history_filename=history_file.name,
                future_filename=future_file.name,
                history_file=history_bytes,
                future_file=future_bytes,
                stock_tampon=stock_tampon,
                tuning_cfg=result.tuning_cfg,
                tuning_metrics=result.tuning_metrics,
                predict_start=result.predict_start,
                predict_end=result.predict_end,
            )

            rows = [
                ForecastRow(
                    forecast=forecast,
                    date=r["date"],
                    school=r["school"],
                    reservation_theorique=r["reservation_theorique"],
                    delta_learned=r["delta_learned"],
                    amount_predicted=r["amount_predicted"],
                    supplement_humain=0,
                    final_amount=max(r["amount_predicted"], 0),
                )
                for r in result.rows
            ]
            ForecastRow.objects.bulk_create(rows, batch_size=1000)

        return forecast
