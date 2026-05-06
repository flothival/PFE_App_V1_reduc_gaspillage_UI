"""
Tests pour DELETE /api/forecasting/forecasts/{id}/

Comportement attendu :
- 204 No Content quand la suppression réussit
- Cascade : tous les ForecastRow liés sont supprimés aussi
  (assuré par on_delete=models.CASCADE sur la FK ForecastRow.forecast)
"""
import pytest

from apps.forecasting.models import Forecast, ForecastRow

URL = "/api/forecasting/forecasts/"


@pytest.mark.django_db
def test_delete_returns_204(client_a, forecast_for_user_a):
    response = client_a.delete(f"{URL}{forecast_for_user_a.id}/")
    assert response.status_code == 204


@pytest.mark.django_db
def test_delete_cascades_to_rows(client_a, forecast_for_user_a):
    """Suppression du Forecast → 0 row restante en BDD."""
    forecast_id = forecast_for_user_a.id
    rows_before = ForecastRow.objects.filter(forecast_id=forecast_id).count()
    assert rows_before == 2  # sanity check : la fixture en a bien créé 2

    client_a.delete(f"{URL}{forecast_id}/")

    assert not Forecast.objects.filter(pk=forecast_id).exists()
    assert ForecastRow.objects.filter(forecast_id=forecast_id).count() == 0


@pytest.mark.django_db
def test_delete_requires_auth(anon_client, forecast_for_user_a):
    response = anon_client.delete(f"{URL}{forecast_for_user_a.id}/")
    assert response.status_code == 401
    assert Forecast.objects.filter(pk=forecast_for_user_a.id).exists()
