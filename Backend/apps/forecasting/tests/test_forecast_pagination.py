"""
Tests pour la pagination de GET /api/forecasting/forecasts/

ForecastPagination = PageNumberPagination
    page_size = 20 (par défaut)
    page_size_query_param = "page_size" (surchargeable par le client)
    max_page_size = 100

Format de réponse DRF (PageNumberPagination) :
{
    "count": 25,
    "next": "http://.../forecasts/?page=2",
    "previous": null,
    "results": [ ... ]
}
"""
from datetime import date

import pytest

from apps.forecasting.models import Forecast

URL = "/api/forecasting/forecasts/"


def _create_forecasts(user, n):
    """Crée n Forecast minimaux pour un user — sans rows pour rester rapide."""
    Forecast.objects.bulk_create([
        Forecast(
            user=user,
            status=Forecast.Status.DONE,
            history_filename=f"hist_{i}.csv",
            future_filename=f"fut_{i}.csv",
            history_file=b"",
            future_file=b"",
            stock_tampon=250,
            tuning_cfg={},
            tuning_metrics={},
            predict_start=date(2026, 1, 1),
            predict_end=date(2026, 1, 7),
        )
        for i in range(n)
    ])


@pytest.mark.django_db
def test_pagination_default_page_size_is_20(client_a, user_a):
    """25 forecasts → page 1 renvoie 20 résultats + un lien `next`."""
    _create_forecasts(user_a, 25)

    response = client_a.get(URL)
    assert response.status_code == 200
    body = response.json()

    assert body["count"] == 25
    assert len(body["results"]) == 20
    assert body["next"] is not None
    assert body["previous"] is None


@pytest.mark.django_db
def test_pagination_second_page_returns_remainder(client_a, user_a):
    """25 forecasts → page 2 renvoie les 5 restants + `next` à null."""
    _create_forecasts(user_a, 25)

    response = client_a.get(f"{URL}?page=2")
    assert response.status_code == 200
    body = response.json()

    assert len(body["results"]) == 5
    assert body["next"] is None
    assert body["previous"] is not None


@pytest.mark.django_db
def test_pagination_custom_page_size(client_a, user_a):
    """Le client peut demander une page plus grande via ?page_size=."""
    _create_forecasts(user_a, 25)

    response = client_a.get(f"{URL}?page_size=10")
    assert response.status_code == 200
    body = response.json()

    assert len(body["results"]) == 10
    assert body["count"] == 25


@pytest.mark.django_db
def test_pagination_caps_at_max_page_size(client_a, user_a):
    """Un client malveillant qui demande page_size=10000 est plafonné à 100."""
    _create_forecasts(user_a, 150)

    response = client_a.get(f"{URL}?page_size=10000")
    assert response.status_code == 200
    body = response.json()

    # Plafonné à 100 (max_page_size), pas 10000
    assert len(body["results"]) == 100


@pytest.mark.django_db
def test_pagination_invalid_page_returns_404(client_a, user_a):
    """Une page hors range (ex: page=99 sur 25 items) renvoie 404."""
    _create_forecasts(user_a, 25)

    response = client_a.get(f"{URL}?page=99")
    assert response.status_code == 404
