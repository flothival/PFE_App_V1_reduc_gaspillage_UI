from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import date
from typing import Any

import pandas as pd

from .io_utils import CsvSource, load_future_reservations_csv, load_history_csv
from .model import predict_reservations, train_learned_deltas
from .split_data import split_for_future
from .tuning import auto_tune_cfg

logger = logging.getLogger(__name__)


@dataclass
class ForecastResult:
    """Structured output of the full forecasting pipeline.

    Designed to be easy to persist : `rows` maps 1-to-1 to ForecastRow records,
    `tuning_cfg` and `tuning_metrics` go on the parent Forecast as JSON.
    """

    rows: list[dict[str, Any]]
    tuning_cfg: dict[str, Any]
    tuning_metrics: dict[str, Any]
    predict_start: date
    predict_end: date


def run_forecast_pipeline(
    *,
    history_source: CsvSource,
    future_source: CsvSource,
    stock_tampon: int = 250,
    min_daily_net_floor: int = -300,
) -> ForecastResult:
    """Run the full forecasting pipeline end-to-end.

    Equivalent of the Tkinter `_generate_preview` flow, with no UI dependencies :
        1. Load history + future CSVs (paths or Django UploadedFile)
        2. Auto-split history into train + validate, isolate future to predict
        3. Auto-tune the model on the previous month
        4. Train learned deltas on the full history
        5. Predict amount per (date, school) for the future dates
    """
    t0 = time.monotonic()
    logger.info("Pipeline démarré — stock_tampon=%d", stock_tampon)

    history = load_history_csv(history_source)
    future_all = load_future_reservations_csv(future_source)
    logger.debug("CSV chargés — historique: %d lignes, futur: %d lignes", len(history), len(future_all))

    plan = split_for_future(history, future_all)
    logger.debug(
        "Découpage terminé — train: %d lignes, validate: %d lignes, futur à prédire: %d lignes",
        len(plan.train_final), len(plan.validate), len(plan.future_to_predict),
    )

    tuning = auto_tune_cfg(
        train_sep_oct=plan.train_tune,
        validate_nov=plan.validate,
        stock_tampon_per_day=stock_tampon,
        min_daily_net_floor=min_daily_net_floor,
    )
    logger.debug(
        "Tuning terminé — waste=%s shortage=%s min_daily_net=%s",
        tuning.total_waste, tuning.total_shortage, tuning.min_daily_net,
    )

    learned_tbl = train_learned_deltas(plan.train_final, tuning.cfg)
    logger.debug("Deltas appris — %d écoles dans la table", len(learned_tbl))

    preds = predict_reservations(plan.future_to_predict, learned_tbl, cfg=tuning.cfg)
    preds = preds.sort_values(["date", "school"]).reset_index(drop=True)

    rows = [
        {
            "date": pd.to_datetime(r["date"]).date(),
            "school": str(r["school"]),
            "reservation_theorique": int(r["reservation_theorique"]),
            "delta_learned": int(r["delta_learned"]),
            "amount_predicted": int(r["amount_predicted"]),
        }
        for _, r in preds.iterrows()
    ]

    tuning_cfg = {
        "min_obs_school_weekday": tuning.cfg.min_obs_school_weekday,
        "learned_delta_scale": tuning.cfg.learned_delta_scale,
        "learned_delta_max_abs": tuning.cfg.learned_delta_max_abs,
        "allow_positive_deltas": tuning.cfg.allow_positive_deltas,
        "floor_ratio": tuning.cfg.floor_ratio,
    }

    tuning_metrics = {
        "total_waste": tuning.total_waste,
        "total_shortage": tuning.total_shortage,
        "min_daily_net": tuning.min_daily_net,
    }

    elapsed = time.monotonic() - t0
    logger.info(
        "Pipeline terminé en %.2fs — %d prévisions générées (%s → %s)",
        elapsed, len(rows),
        plan.predict_start_date.date(), plan.predict_end_date.date(),
    )

    return ForecastResult(
        rows=rows,
        tuning_cfg=tuning_cfg,
        tuning_metrics=tuning_metrics,
        predict_start=plan.predict_start_date.date(),
        predict_end=plan.predict_end_date.date(),
    )
