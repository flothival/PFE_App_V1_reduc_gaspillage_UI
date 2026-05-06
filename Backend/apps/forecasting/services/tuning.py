from __future__ import annotations

from dataclasses import dataclass

import pandas as pd

from .model import ModelCfg, predict_reservations, train_learned_deltas


@dataclass(frozen=True)
class TuningResult:
    cfg: ModelCfg
    total_waste: int
    total_shortage: int
    min_daily_net: int


def _eval_daily_totals(
    *,
    preds: pd.DataFrame,
    actuals: pd.DataFrame,
    stock_tampon_per_day: int,
) -> tuple[int, int, int]:
    p = preds.copy()
    a = actuals.copy()

    p["date"] = pd.to_datetime(p["date"], errors="coerce").dt.normalize()
    a["date"] = pd.to_datetime(a["date"], errors="coerce").dt.normalize()

    p_tot = p.groupby("date", as_index=False)["amount_predicted"].sum().rename(columns={"amount_predicted": "pred"})
    a_tot = a.groupby("date", as_index=False)["presence_reel_eleve"].sum().rename(
        columns={"presence_reel_eleve": "real"}
    )

    daily = a_tot.merge(p_tot, on="date", how="left")
    daily["pred"] = daily["pred"].fillna(0).astype(int) + int(stock_tampon_per_day)
    daily["real"] = pd.to_numeric(daily["real"], errors="coerce").fillna(0).astype(int)

    daily["net"] = daily["pred"] - daily["real"]
    daily["waste"] = daily["net"].clip(lower=0)
    daily["shortage"] = (-daily["net"]).clip(lower=0)

    total_waste = int(daily["waste"].sum())
    total_shortage = int(daily["shortage"].sum())
    min_daily_net = int(daily["net"].min()) if len(daily) else 0

    return total_waste, total_shortage, min_daily_net


def auto_tune_cfg(
    *,
    train_sep_oct: pd.DataFrame,
    validate_nov: pd.DataFrame,
    stock_tampon_per_day: int,
    min_daily_net_floor: int = -300,
) -> TuningResult:
    # Small grid on purpose: keep it fast and robust.
    scales = [0.6, 0.8, 1.0, 1.2, 1.4]
    max_abs_list = [10, 25, 50]
    floor_ratios = [0.6, 0.7, 0.8, 0.9]

    best: TuningResult | None = None

    for scale in scales:
        for max_abs in max_abs_list:
            for floor_ratio in floor_ratios:
                cfg = ModelCfg(
                    min_obs_school_weekday=3,
                    learned_delta_scale=float(scale),
                    learned_delta_max_abs=int(max_abs),
                    allow_positive_deltas=False,
                    floor_ratio=float(floor_ratio),
                )

                learned = train_learned_deltas(train_sep_oct, cfg)

                future = validate_nov[["date", "school", "reservation_theorique"]].copy()
                preds = predict_reservations(future, learned, cfg=cfg)

                waste, shortage, min_net = _eval_daily_totals(
                    preds=preds,
                    actuals=validate_nov,
                    stock_tampon_per_day=int(stock_tampon_per_day),
                )

                if min_net < int(min_daily_net_floor):
                    continue

                cand = TuningResult(cfg=cfg, total_waste=waste, total_shortage=shortage, min_daily_net=min_net)

                if best is None:
                    best = cand
                    continue

                # Primary objective: minimize waste; secondary: minimize shortage.
                if (cand.total_waste, cand.total_shortage) < (best.total_waste, best.total_shortage):
                    best = cand

    if best is None:
        # If nothing satisfies the net constraint, fall back to a conservative config.
        fallback = ModelCfg(
            min_obs_school_weekday=3,
            learned_delta_scale=1.2,
            learned_delta_max_abs=25,
            allow_positive_deltas=False,
            floor_ratio=0.9,
        )
        learned = train_learned_deltas(train_sep_oct, fallback)
        future = validate_nov[["date", "school", "reservation_theorique"]].copy()
        preds = predict_reservations(future, learned, cfg=fallback)
        waste, shortage, min_net = _eval_daily_totals(
            preds=preds,
            actuals=validate_nov,
            stock_tampon_per_day=int(stock_tampon_per_day),
        )
        return TuningResult(cfg=fallback, total_waste=waste, total_shortage=shortage, min_daily_net=min_net)

    return best
