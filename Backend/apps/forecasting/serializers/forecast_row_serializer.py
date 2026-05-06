from rest_framework import serializers

from apps.forecasting.models import ForecastRow


class ForecastRowSerializer(serializers.ModelSerializer):
    """Read + partial update of a forecast line.

    Only `supplement_humain` is user-editable. `final_amount` is recomputed
    automatically by the model's save() override.
    """

    class Meta:
        model = ForecastRow
        fields = [
            "id",
            "date",
            "school",
            "reservation_theorique",
            "delta_learned",
            "amount_predicted",
            "supplement_humain",
            "final_amount",
        ]
        read_only_fields = [
            "id",
            "date",
            "school",
            "reservation_theorique",
            "delta_learned",
            "amount_predicted",
            "final_amount",
        ]
