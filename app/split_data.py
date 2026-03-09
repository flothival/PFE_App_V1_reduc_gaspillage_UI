from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import pandas as pd


@dataclass(frozen=True)
class SplitPlan:
    cutoff_last_actual_date: pd.Timestamp
    predict_start_date: pd.Timestamp
    predict_end_date: pd.Timestamp
    train_tune: pd.DataFrame
    validate: pd.DataFrame
    train_final: pd.DataFrame
    future_to_predict: pd.DataFrame


def _prev_month_window(dt: pd.Timestamp) -> tuple[pd.Timestamp, pd.Timestamp]:
    dt = pd.to_datetime(dt).normalize()
    first_this_month = dt.replace(day=1)
    last_prev_month = first_this_month - pd.Timedelta(days=1)
    first_prev_month = last_prev_month.replace(day=1)
    return first_prev_month, last_prev_month


def split_for_future(history: pd.DataFrame, future_reservations: pd.DataFrame) -> SplitPlan:
    """Create an automatic, leak-safe split for tuning + prediction.

    - cutoff_last_actual_date: last date with real presence in history
    - future_to_predict: dates strictly after cutoff_last_actual_date (if any)
    - validate: previous calendar month relative to predict_start_date (if available)
    - train_tune: all history strictly before validate month
    - train_final: all history up to cutoff_last_actual_date (inclusive)
    """

    h = history.copy()
    h["date"] = pd.to_datetime(h["date"], errors="coerce")
    h = h.dropna(subset=["date", "school", "reservation_theorique", "presence_reel_eleve"]).copy()

    f = future_reservations.copy()
    f["date"] = pd.to_datetime(f["date"], errors="coerce")
    f = f.dropna(subset=["date", "school", "reservation_theorique"]).copy()

    if h.empty:
        raise ValueError("History is empty after cleaning.")
    if f.empty:
        raise ValueError("Future reservations is empty after cleaning.")

    cutoff = pd.to_datetime(h["date"].max()).normalize()

    # Only predict what is truly in the future relative to available actuals.
    f_future = f[pd.to_datetime(f["date"]).dt.normalize() > cutoff].copy()
    if f_future.empty:
        # If user gave only past dates, fall back to predicting whatever is provided.
        f_future = f.copy()

    predict_start = pd.to_datetime(f_future["date"].min()).normalize()
    predict_end = pd.to_datetime(f_future["date"].max()).normalize()

    val_start, val_end = _prev_month_window(predict_start)
    validate = h[(h["date"].dt.normalize() >= val_start) & (h["date"].dt.normalize() <= val_end)].copy()

    # If we don't have that month (e.g., not enough history), use last 28 days as validate.
    if validate.empty:
        val_end2 = cutoff
        val_start2 = cutoff - pd.Timedelta(days=27)
        validate = h[(h["date"].dt.normalize() >= val_start2) & (h["date"].dt.normalize() <= val_end2)].copy()
        val_start, val_end = val_start2, val_end2

    train_tune = h[h["date"].dt.normalize() < val_start].copy()
    if train_tune.empty:
        # Worst-case: if history is too short, tune on everything but keep it functional.
        train_tune = h.copy()

    train_final = h[h["date"].dt.normalize() <= cutoff].copy()

    future_to_predict = f_future[["date", "school", "reservation_theorique"]].copy()

    return SplitPlan(
        cutoff_last_actual_date=cutoff,
        predict_start_date=predict_start,
        predict_end_date=predict_end,
        train_tune=train_tune,
        validate=validate,
        train_final=train_final,
        future_to_predict=future_to_predict,
    )


def write_december_days(december_reservations: pd.DataFrame, out_dir: str | Path) -> None:
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    df = december_reservations.copy()
    df["date"] = pd.to_datetime(df["date"], errors="coerce").dt.normalize()
    df = df.dropna(subset=["date", "school", "reservation_theorique"]).copy()

    for day, sub in df.groupby("date"):
        day_str = pd.to_datetime(day).date().isoformat()
        p = out_dir / f"{day_str}.csv"
        out = sub[["date", "school", "reservation_theorique"]].copy()
        out["date"] = pd.to_datetime(out["date"]).dt.date.astype(str)
        out.to_csv(p, index=False, encoding="utf-8-sig")
