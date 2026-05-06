"""
Tests pour POST /api/forecasting/forecasts/

On vérifie :
- Auth obligatoire (401 si pas de JWT)
- Validation des fichiers (400 si mauvaise extension)
- Validation stricte des colonnes (400 si colonnes requises absentes)
- Création réussie (201) → Forecast + ForecastRow persistés, user attribué
"""
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.forecasting.models import Forecast, ForecastRow

URL = "/api/forecasting/forecasts/"

_HISTORY_CONTENT = (
    b"date,school,reservation_theorique,presence_reel_eleve\n"
    b"2025-09-01,SCHOOL A,100,95\n"
)
_FUTURE_CONTENT = (
    b"date,school,reservation_theorique\n"
    b"2025-11-03,SCHOOL A,100\n"
)


def _history_csv(name="hist.csv", content=_HISTORY_CONTENT):
    return SimpleUploadedFile(name, content, content_type="text/csv")


def _future_csv(name="fut.csv", content=_FUTURE_CONTENT):
    return SimpleUploadedFile(name, content, content_type="text/csv")


@pytest.mark.django_db
def test_create_requires_auth(anon_client):
    response = anon_client.post(URL, {}, format="multipart")
    assert response.status_code == 401


@pytest.mark.django_db
def test_create_rejects_non_csv_extension(client_a, mock_pipeline):
    """Le serializer rejette les fichiers qui ne finissent pas par .csv."""
    response = client_a.post(
        URL,
        {
            "history_file": _history_csv(name="hist.txt"),
            "future_file": _future_csv(),
            "stock_tampon": 250,
        },
        format="multipart",
    )
    assert response.status_code == 400
    assert "history_file" in response.json()


@pytest.mark.django_db
def test_create_rejects_history_with_missing_column(client_a):
    """Un historique sans `presence_reel_eleve` renvoie 400 avec un message lisible."""
    bad_history = _history_csv(content=b"date,school,reservation_theorique\n2025-09-01,SCHOOL A,100\n")
    response = client_a.post(
        URL,
        {
            "history_file": bad_history,
            "future_file": _future_csv(),
            "stock_tampon": 250,
        },
        format="multipart",
    )
    assert response.status_code == 400
    assert "history_file" in response.json()


@pytest.mark.django_db
def test_create_rejects_future_with_missing_column(client_a):
    """Un fichier futur sans `reservation_theorique` renvoie 400 avec un message lisible."""
    bad_future = _future_csv(content=b"date,school\n2025-11-03,SCHOOL A\n")
    response = client_a.post(
        URL,
        {
            "history_file": _history_csv(),
            "future_file": bad_future,
            "stock_tampon": 250,
        },
        format="multipart",
    )
    assert response.status_code == 400
    assert "future_file" in response.json()


@pytest.mark.django_db
def test_create_persists_forecast_and_rows(client_a, user_a, mock_pipeline):
    """Le happy path : upload CSV → pipeline mocké → BDD remplie."""
    assert Forecast.objects.count() == 0

    response = client_a.post(
        URL,
        {
            "history_file": _history_csv(),
            "future_file": _future_csv(),
            "stock_tampon": 250,
        },
        format="multipart",
    )

    assert response.status_code == 201

    # 1 Forecast en BDD, attribué au bon user
    assert Forecast.objects.count() == 1
    forecast = Forecast.objects.first()
    assert forecast.user_id == user_a.id
    assert forecast.status == Forecast.Status.DONE
    assert forecast.stock_tampon == 250

    # Les rows du fake pipeline ont bien été persistées
    assert ForecastRow.objects.filter(forecast=forecast).count() == 2

    # final_amount calculé inline lors du bulk_create (= amount_predicted, supplement_humain=0)
    rows = list(ForecastRow.objects.filter(forecast=forecast).order_by("school"))
    assert rows[0].school == "AKIRA KUROSAWA"
    assert rows[0].final_amount == 47
    assert rows[1].school == "ALAIN SAVARY"
    assert rows[1].final_amount == 108

    # Le pipeline a bien été appelé exactement une fois
    assert mock_pipeline.call_count == 1


@pytest.mark.django_db
def test_create_default_stock_tampon(client_a, mock_pipeline):
    """Si stock_tampon n'est pas fourni, le serializer prend la valeur par défaut (250)."""
    response = client_a.post(
        URL,
        {
            "history_file": _history_csv(),
            "future_file": _future_csv(),
        },
        format="multipart",
    )
    assert response.status_code == 201
    assert Forecast.objects.first().stock_tampon == 250
