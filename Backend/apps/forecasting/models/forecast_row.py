from django.db import models

from .forecast import Forecast


class ForecastRow(models.Model):
    """One predicted line within a `Forecast` : a (date, school) pair.

    `amount_predicted` is the model output, `supplement_humain` is the manual
    tweak applied by the user, `final_amount = max(predicted + supplement, 0)`.
    The final value is stored to make day-level aggregations (and exports)
    cheap, and is recomputed on save.
    """

    forecast = models.ForeignKey(
        Forecast,
        on_delete=models.CASCADE,
        related_name="rows",
        verbose_name="Prévision parente",
    )
    date = models.DateField(verbose_name="Date")
    school = models.CharField(max_length=255, verbose_name="École")

    reservation_theorique = models.PositiveIntegerField(verbose_name="Réservation théorique")
    delta_learned = models.IntegerField(verbose_name="Delta appris")
    amount_predicted = models.PositiveIntegerField(verbose_name="Quantité prédite (modèle)")

    supplement_humain = models.IntegerField(default=0, verbose_name="Supplément humain")
    final_amount = models.PositiveIntegerField(verbose_name="Quantité finale à préparer")

    class Meta:
        verbose_name = "Ligne de prévision"
        verbose_name_plural = "Lignes de prévision"
        ordering = ["date", "school"]
        indexes = [
            models.Index(fields=["forecast", "date"]),
            models.Index(fields=["forecast", "school"]),
        ]
        # No unique (forecast, date, school) constraint : the source CSV may
        # legitimately contain several rows for the same (date, school) couple
        # (e.g. multiple meal streams). The original Tkinter app preserves them.

    def save(self, *args, **kwargs):
        # Always keep final_amount consistent with predicted + supplement
        self.final_amount = max(int(self.amount_predicted) + int(self.supplement_humain), 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date} — {self.school} — {self.final_amount}"
