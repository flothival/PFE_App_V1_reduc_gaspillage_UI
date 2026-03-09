from __future__ import annotations

import math
from dataclasses import dataclass

import pandas as pd


@dataclass(frozen=True)
class ModelCfg:
    min_obs_school_weekday: int = 3

    # Learned delta = round(-scale * median(residual)), residual = reservation - presence
    learned_delta_scale: float = 1.2
    learned_delta_max_abs: int = 25

    # Delta policy
    allow_positive_deltas: bool = False

    # Floor relative to reservation
    floor_ratio: float = 0.80


def _norm_school(s: str) -> str:
    if s is None:
        return ""
    s = str(s).upper().strip()
    s = " ".join(s.split())
    return s


def train_learned_deltas(history: pd.DataFrame, cfg: ModelCfg) -> pd.DataFrame:
    """Learn per-(school, weekday) median residuals and convert to deltas."""
    df = history.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "school", "reservation_theorique", "presence_reel_eleve"]).copy()

    df["school_norm"] = df["school"].map(_norm_school)
    df["weekday_num"] = df["date"].dt.weekday

    df["residual"] = df["reservation_theorique"].astype(float) - df["presence_reel_eleve"].astype(float)

    stats = (
        df.groupby(["school_norm", "weekday_num"], as_index=False)["residual"]
        .agg(n_obs="count", median_residual="median")
        .query("n_obs >= @cfg.min_obs_school_weekday")
        .reset_index(drop=True)
    )

    stats["delta_raw"] = -cfg.learned_delta_scale * stats["median_residual"]
    stats["delta_learned"] = stats["delta_raw"].round().astype(int)
    stats["delta_learned"] = stats["delta_learned"].clip(
        lower=-cfg.learned_delta_max_abs, upper=cfg.learned_delta_max_abs
    )
    if not cfg.allow_positive_deltas:
        stats["delta_learned"] = stats["delta_learned"].clip(upper=0)

    return stats[["school_norm", "weekday_num", "n_obs", "median_residual", "delta_learned"]]


def predict_reservations(
    future_reservations: pd.DataFrame,
    learned_tbl: pd.DataFrame,
    *,
    cfg: ModelCfg,
) -> pd.DataFrame:
    """Predict per row (school, date) using reservation baseline + learned delta + floor.

    Note: the daily global "stock tampon" (+250 by default) is handled at the application
    layer so it can be added as a separate line item (e.g., SCHOOL='STOCK TAMPON') and
    clearly audited.
    """

    df = future_reservations.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date", "school", "reservation_theorique"]).copy()

    df["school_norm"] = df["school"].map(_norm_school)
    df["weekday_num"] = df["date"].dt.weekday

    df = df.merge(
        learned_tbl[["school_norm", "weekday_num", "delta_learned"]],
        on=["school_norm", "weekday_num"],
        how="left",
    )
    df["delta_learned"] = df["delta_learned"].fillna(0).astype(int)

    base = df["reservation_theorique"].astype(float)
    pred0 = (base + df["delta_learned"].astype(float)).clip(lower=0.0)

    floor_val = (cfg.floor_ratio * base).apply(lambda x: math.ceil(x)).astype(int)
    pred1 = pred0.apply(lambda x: math.ceil(x)).astype(int)

    df["amount_predicted"] = pred1.where(pred1 >= floor_val, floor_val)

    return df[["date", "school", "reservation_theorique", "delta_learned", "amount_predicted"]]
