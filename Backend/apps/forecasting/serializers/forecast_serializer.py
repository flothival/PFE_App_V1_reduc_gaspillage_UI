import io

from django.db import transaction
from rest_framework import serializers

from apps.forecasting.models import Forecast, ForecastRow
from apps.forecasting.services.pipeline import run_forecast_pipeline

from .forecast_row_serializer import ForecastRowSerializer


class ForecastListSerializer(serializers.ModelSerializer):
    """Light serializer for list views — no nested rows to keep payload small."""

    rows_count = serializers.IntegerField(source="rows.count", read_only=True)

    class Meta:
        model = Forecast
        fields = [
            "id",
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


class ForecastCreateSerializer(serializers.Serializer):
    """Serializer for the upload endpoint.

    Receives the 2 CSV files + stock_tampon, runs the forecasting pipeline,
    creates the Forecast row and bulk-creates the ForecastRow children.
    """

    history_file = serializers.FileField(write_only=True)
    future_file = serializers.FileField(write_only=True)
    stock_tampon = serializers.IntegerField(default=250, min_value=0)

    def validate_history_file(self, value):
        if not value.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Le fichier doit être un CSV (.csv).")
        return value

    def validate_future_file(self, value):
        if not value.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Le fichier doit être un CSV (.csv).")
        return value

    def create(self, validated_data):
        history_file = validated_data["history_file"]
        future_file = validated_data["future_file"]
        stock_tampon = validated_data["stock_tampon"]
        user = self.context["request"].user

        # Materialize bytes once : we both store them in DB AND feed them to the pipeline
        history_file.seek(0)
        history_bytes = history_file.read()
        future_file.seek(0)
        future_bytes = future_file.read()

        try:
            result = run_forecast_pipeline(
                history_source=io.BytesIO(history_bytes),
                future_source=io.BytesIO(future_bytes),
                stock_tampon=stock_tampon,
            )
        except Exception as exc:
            raise serializers.ValidationError(
                {"detail": f"Échec du pipeline de prévision : {exc}"}
            )

        # Forecast + rows must be created atomically — orphan Forecast rows
        # would leak into the listing without their predicted lines.
        with transaction.atomic():
            forecast = Forecast.objects.create(
                user=user,
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

            # bulk_create skips save() → we compute final_amount inline
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
