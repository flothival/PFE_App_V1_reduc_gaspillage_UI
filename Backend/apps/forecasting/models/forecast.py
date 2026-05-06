from django.conf import settings
from django.db import models


class Forecast(models.Model):
    """One forecasting session run by a user.

    Holds the metadata + the source CSVs (stored in DB as bytes) + the
    tuning result. The actual predicted lines live in `ForecastRow`,
    one per (date, school).
    """

    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        PROCESSING = "processing", "En cours"
        DONE = "done", "Terminé"
        ERROR = "error", "Erreur"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="forecasts",
        verbose_name="Utilisateur",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Créée le")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="Statut",
    )

    # Source CSVs persisted in DB 
    history_filename = models.CharField(max_length=255, verbose_name="Nom du CSV historique")
    future_filename = models.CharField(max_length=255, verbose_name="Nom du CSV futur")
    history_file = models.BinaryField(verbose_name="Contenu CSV historique")
    future_file = models.BinaryField(verbose_name="Contenu CSV futur")

    # User-supplied parameter
    stock_tampon = models.PositiveIntegerField(default=250, verbose_name="Stock tampon / jour")

    # Auto-tuning output
    tuning_cfg = models.JSONField(default=dict, verbose_name="Config de tuning retenue")
    tuning_metrics = models.JSONField(default=dict, verbose_name="Métriques de tuning")

    # Date range covered by this forecast
    predict_start = models.DateField(null=True, blank=True, verbose_name="Début de prédiction")
    predict_end = models.DateField(null=True, blank=True, verbose_name="Fin de prédiction")

    # Optional error message for failed runs
    error_message = models.TextField(blank=True, default="", verbose_name="Message d'erreur")

    class Meta:
        verbose_name = "Prévision"
        verbose_name_plural = "Prévisions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Forecast #{self.pk} — {self.user} — {self.created_at:%Y-%m-%d %H:%M}"
