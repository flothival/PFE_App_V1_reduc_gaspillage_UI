"""
Fixtures partagées pour les tests forecasting.

pytest découvre automatiquement ce fichier et rend les fixtures disponibles
dans tous les tests du dossier (et sous-dossiers).
"""
from datetime import date
from unittest.mock import patch

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.forecasting.models import Forecast, ForecastRow

User = get_user_model()


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

@pytest.fixture
def user_a(db):
    """Un user lambda. La fixture `db` (fournie par pytest-django) ouvre
    une transaction qui sera rollback à la fin du test → BDD propre."""
    return User.objects.create_user(
        username="alice",
        email="alice@example.com",
        password="alicepass123",
    )


@pytest.fixture
def user_b(db):
    return User.objects.create_user(
        username="bob",
        email="bob@example.com",
        password="bobpass123",
    )


# ---------------------------------------------------------------------------
# Clients HTTP authentifiés
# ---------------------------------------------------------------------------

def _auth_client(user):
    """Crée un APIClient avec un JWT valide pour `user`."""
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def client_a(user_a):
    return _auth_client(user_a)


@pytest.fixture
def client_b(user_b):
    return _auth_client(user_b)


@pytest.fixture
def anon_client():
    """Un client non authentifié — pour tester les 401."""
    return APIClient()


# ---------------------------------------------------------------------------
# Forecast en BDD (sans passer par le pipeline ni l'API)
# ---------------------------------------------------------------------------

@pytest.fixture
def forecast_for_user_a(user_a):
    """Crée un Forecast + 2 ForecastRow pour user_a directement via l'ORM.
    Permet de tester GET / PATCH / DELETE / export sans dépendre du pipeline."""
    forecast = Forecast.objects.create(
        user=user_a,
        status=Forecast.Status.DONE,
        history_filename="hist.csv",
        future_filename="fut.csv",
        history_file=b"date,school,reservation\n",
        future_file=b"date,school,reservation\n",
        stock_tampon=250,
        tuning_cfg={"window": 30},
        tuning_metrics={"total_waste": 1234},
        predict_start=date(2026, 1, 1),
        predict_end=date(2026, 1, 7),
    )
    ForecastRow.objects.create(
        forecast=forecast,
        date=date(2026, 1, 1),
        school="ALAIN SAVARY",
        reservation_theorique=120,
        delta_learned=-12,
        amount_predicted=108,
        supplement_humain=0,
        final_amount=108,
    )
    ForecastRow.objects.create(
        forecast=forecast,
        date=date(2026, 1, 1),
        school="AKIRA KUROSAWA",
        reservation_theorique=50,
        delta_learned=-3,
        amount_predicted=47,
        supplement_humain=0,
        final_amount=47,
    )
    return forecast


# ---------------------------------------------------------------------------
# Mock du pipeline : pour les tests qui hit POST /forecasts/
# ---------------------------------------------------------------------------

class _FakePipelineResult:
    """Imite l'objet renvoyé par run_forecast_pipeline()."""
    tuning_cfg = {"window": 30, "alpha": 0.5}
    tuning_metrics = {"total_waste": 1234, "min_daily_net": 50}
    predict_start = date(2026, 1, 1)
    predict_end = date(2026, 1, 7)
    rows = [
        {
            "date": date(2026, 1, 1),
            "school": "ALAIN SAVARY",
            "reservation_theorique": 120,
            "delta_learned": -12,
            "amount_predicted": 108,
        },
        {
            "date": date(2026, 1, 1),
            "school": "AKIRA KUROSAWA",
            "reservation_theorique": 50,
            "delta_learned": -3,
            "amount_predicted": 47,
        },
    ]


@pytest.fixture
def mock_pipeline():
    """Patch run_forecast_pipeline là où il est IMPORTÉ (dans le serializer),
    pas là où il est défini. Sinon le patch ne prend pas effet."""
    with patch(
        "apps.forecasting.serializers.forecast_serializer.run_forecast_pipeline",
        return_value=_FakePipelineResult(),
    ) as m:
        yield m
