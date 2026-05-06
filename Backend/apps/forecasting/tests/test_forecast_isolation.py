"""
Tests d'isolation utilisateur.

Chaque user ne doit voir / modifier / supprimer QUE ses propres prévisions.
Ce contrat est implémenté par :
    Forecast.objects.filter(user=request.user)
dans ForecastViewSet.get_queryset(). Si quelqu'un casse ce filtre par accident,
ces tests sautent immédiatement.

Note : DRF renvoie 404 (et pas 403) quand on tape sur l'objet d'un autre user,
parce que le queryset filtré ne contient simplement pas l'objet — get_object()
lève Http404 avant tout check de permission. C'est le comportement souhaité :
ça empêche un attaquant de découvrir l'existence des IDs des autres.
"""
import pytest

from apps.forecasting.models import Forecast, ForecastRow

URL = "/api/forecasting/forecasts/"


@pytest.mark.django_db
def test_list_only_returns_own_forecasts(client_a, client_b, forecast_for_user_a):
    """user_a voit son forecast, user_b voit une liste vide.

    La réponse est paginée → on lit `results` (pas la racine), et `count`
    pour vérifier le total."""
    response_a = client_a.get(URL)
    assert response_a.status_code == 200
    body_a = response_a.json()
    assert body_a["count"] == 1
    assert len(body_a["results"]) == 1
    assert body_a["results"][0]["id"] == forecast_for_user_a.id

    response_b = client_b.get(URL)
    assert response_b.status_code == 200
    body_b = response_b.json()
    assert body_b["count"] == 0
    assert body_b["results"] == []


@pytest.mark.django_db
def test_detail_404_for_other_user(client_b, forecast_for_user_a):
    """user_b ne peut pas GET le forecast de user_a → 404."""
    response = client_b.get(f"{URL}{forecast_for_user_a.id}/")
    assert response.status_code == 404


@pytest.mark.django_db
def test_delete_404_for_other_user(client_b, forecast_for_user_a):
    """user_b ne peut pas DELETE le forecast de user_a → 404, et
    le forecast reste en BDD."""
    response = client_b.delete(f"{URL}{forecast_for_user_a.id}/")
    assert response.status_code == 404
    assert Forecast.objects.filter(pk=forecast_for_user_a.id).exists()


@pytest.mark.django_db
def test_patch_row_404_for_other_user(client_b, forecast_for_user_a):
    """user_b ne peut pas éditer une row du forecast de user_a → 404,
    et la valeur reste inchangée."""
    row = forecast_for_user_a.rows.first()
    original_supplement = row.supplement_humain

    response = client_b.patch(
        f"{URL}{forecast_for_user_a.id}/rows/{row.id}/",
        {"supplement_humain": 999},
        format="json",
    )
    assert response.status_code == 404

    row.refresh_from_db()
    assert row.supplement_humain == original_supplement


@pytest.mark.django_db
def test_export_404_for_other_user(client_b, forecast_for_user_a):
    """user_b ne peut pas exporter le forecast de user_a → 404."""
    response = client_b.get(f"{URL}{forecast_for_user_a.id}/export/?type=csv")
    assert response.status_code == 404
