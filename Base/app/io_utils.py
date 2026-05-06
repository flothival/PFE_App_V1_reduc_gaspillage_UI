from __future__ import annotations

from pathlib import Path

import pandas as pd


def read_csv_any(path: str | Path) -> pd.DataFrame:
    path = Path(path)
    # Try common separators
    for sep in [",", ";", "\t"]:
        try:
            df = pd.read_csv(path, encoding="utf-8-sig", sep=sep)
            if df.shape[1] >= 2:
                return df
        except Exception:
            continue

    # Fallback
    return pd.read_csv(path, encoding="utf-8-sig")


def ensure_columns(df: pd.DataFrame, mapping: dict[str, str]) -> pd.DataFrame:
    """Rename columns case-insensitively.

    mapping: canonical_name -> existing_possible_name
    Here we resolve by trying many candidates.
    """

    cols_upper = {c.upper(): c for c in df.columns}

    def pick(cands: list[str]) -> str:
        for c in cands:
            if c.upper() in cols_upper:
                return cols_upper[c.upper()]
        raise KeyError(f"Missing required column. Tried: {cands}. Existing: {list(df.columns)}")

    out = df.copy()

    # Standardize
    out = out.rename(
        columns={
            pick(["date", "DATE"]): "date",
            pick(["school", "SCHOOL", "JOIN_SCHOOL_STD", "JOIN_SCHOOL_STD_first"]): "school",
        }
    )

    if "reservation_theorique" in mapping:
        out = out.rename(columns={pick(mapping["reservation_theorique"]): "reservation_theorique"})

    if "presence_reel_eleve" in mapping:
        out = out.rename(columns={pick(mapping["presence_reel_eleve"]): "presence_reel_eleve"})

    return out


def load_history_csv(path: str | Path) -> pd.DataFrame:
    df = read_csv_any(path)
    df = ensure_columns(
        df,
        {
            "reservation_theorique": ["reservation_theorique", "RESERVATION THEORIQUE"],
            "presence_reel_eleve": ["presence_reel_eleve", "PRESENCE REEL ELEVE"],
        },
    )
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["reservation_theorique"] = pd.to_numeric(df["reservation_theorique"], errors="coerce")
    df["presence_reel_eleve"] = pd.to_numeric(df["presence_reel_eleve"], errors="coerce")
    return df


def load_future_reservations_csv(path: str | Path) -> pd.DataFrame:
    df = read_csv_any(path)
    df = ensure_columns(
        df,
        {
            "reservation_theorique": ["reservation_theorique", "RESERVATION THEORIQUE"],
        },
    )
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["reservation_theorique"] = pd.to_numeric(df["reservation_theorique"], errors="coerce")
    return df
