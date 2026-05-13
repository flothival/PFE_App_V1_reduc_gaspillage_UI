"""Gestion du quota de stockage par utilisateur.

Les CSVs uploadés sont stockés en BDD (`BinaryField` sur `Forecast`). Sans
plafond, un utilisateur peut accumuler indéfiniment des prévisions et saturer
la base. On limite la somme `history_file + future_file` à 200 Mo par user ;
au-delà il doit supprimer d'anciennes prévisions pour en créer de nouvelles.
"""

from django.db.models import BigIntegerField, IntegerField, Sum, Value, Func
from django.db.models.functions import Coalesce

from apps.forecasting.models import Forecast


# Quota par utilisateur : 200 Mo 
MAX_STORAGE_BYTES_PER_USER = 200 * 1024 * 1024  # 200 Mo


class OctetLength(Func):
    """SQL `OCTET_LENGTH(bytea)` — taille en octets d'un champ binaire.

    Django expose `Length()` mais celle-ci n'est enregistrée que sur
    CharField/TextField. Pour BinaryField (Postgres `bytea`), on passe par
    OCTET_LENGTH qui retourne directement le nombre d'octets.
    """

    function = "OCTET_LENGTH"
    output_field = IntegerField()


def get_user_storage_used(user) -> int:
    """Somme en octets de tous les CSVs (history + future) du user.

    Un seul aller-retour SQL (agrégat côté base, on ne charge pas les bytes
    en mémoire). Renvoie 0 si l'utilisateur n'a aucune prévision.
    """
    result = Forecast.objects.filter(user=user).aggregate(
        history_total=Coalesce(
            Sum(OctetLength("history_file"), output_field=BigIntegerField()),
            Value(0, output_field=BigIntegerField()),
        ),
        future_total=Coalesce(
            Sum(OctetLength("future_file"), output_field=BigIntegerField()),
            Value(0, output_field=BigIntegerField()),
        ),
    )
    return int(result["history_total"] or 0) + int(result["future_total"] or 0)


def get_user_quota(user) -> dict:
    """Récap quota pour l'endpoint `/quota/` et la barre de progression front."""
    used = get_user_storage_used(user)
    return {
        "used_bytes": used,
        "max_bytes": MAX_STORAGE_BYTES_PER_USER,
        "forecast_count": Forecast.objects.filter(user=user).count(),
    }
