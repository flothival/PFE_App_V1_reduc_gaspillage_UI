"""
Tests pour PATCH /api/forecasting/forecasts/{id}/rows/{row_id}/

Le seul champ éditable est `supplement_humain`. Le `final_amount` doit être
recalculé automatiquement par le model.save() :
    final_amount = max(amount_predicted + supplement_humain, 0)
"""
import pytest

URL = "/api/forecasting/forecasts/"


def _patch(client, forecast_id, row_id, payload):
    return client.patch(
        f"{URL}{forecast_id}/rows/{row_id}/",
        payload,
        format="json",
    )


@pytest.mark.django_db
def test_patch_positive_supplement_recalculates_final(client_a, forecast_for_user_a):
    """supplement = +25 → final = predicted (108) + 25 = 133."""
    row = forecast_for_user_a.rows.get(school="ALAIN SAVARY")

    response = _patch(client_a, forecast_for_user_a.id, row.id, {"supplement_humain": 25})

    assert response.status_code == 200
    row.refresh_from_db()
    assert row.supplement_humain == 25
    assert row.final_amount == 108 + 25


@pytest.mark.django_db
def test_patch_negative_supplement_recalculates_final(client_a, forecast_for_user_a):
    """supplement = -10 → final = 108 - 10 = 98."""
    row = forecast_for_user_a.rows.get(school="ALAIN SAVARY")

    response = _patch(client_a, forecast_for_user_a.id, row.id, {"supplement_humain": -10})

    assert response.status_code == 200
    row.refresh_from_db()
    assert row.final_amount == 98


@pytest.mark.django_db
def test_patch_supplement_clamps_final_at_zero(client_a, forecast_for_user_a):
    """supplement = -500 sur predicted=108 → final ne descend pas en dessous de 0."""
    row = forecast_for_user_a.rows.get(school="ALAIN SAVARY")

    response = _patch(client_a, forecast_for_user_a.id, row.id, {"supplement_humain": -500})

    assert response.status_code == 200
    row.refresh_from_db()
    assert row.supplement_humain == -500
    assert row.final_amount == 0


@pytest.mark.django_db
def test_patch_ignores_readonly_fields(client_a, forecast_for_user_a):
    """Le serializer marque amount_predicted/date/school comme read_only.
    Une tentative de les modifier doit être ignorée silencieusement."""
    row = forecast_for_user_a.rows.get(school="ALAIN SAVARY")
    original_predicted = row.amount_predicted
    original_school = row.school

    response = _patch(
        client_a,
        forecast_for_user_a.id,
        row.id,
        {
            "supplement_humain": 5,
            "amount_predicted": 9999,
            "school": "ECOLE PIRATE",
        },
    )

    assert response.status_code == 200
    row.refresh_from_db()
    assert row.amount_predicted == original_predicted
    assert row.school == original_school
    # Le champ légitime, lui, a bien été appliqué
    assert row.supplement_humain == 5


@pytest.mark.django_db
def test_patch_requires_auth(anon_client, forecast_for_user_a):
    row = forecast_for_user_a.rows.first()
    response = anon_client.patch(
        f"{URL}{forecast_for_user_a.id}/rows/{row.id}/",
        {"supplement_humain": 1},
        format="json",
    )
    assert response.status_code == 401
