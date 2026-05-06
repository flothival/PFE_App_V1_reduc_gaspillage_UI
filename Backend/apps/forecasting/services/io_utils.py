from __future__ import annotations

import io
from pathlib import Path
from typing import IO, Union

import pandas as pd

CsvSource = Union[str, Path, IO[bytes]]


def _read_bytes(source: CsvSource) -> bytes:
    """Read raw bytes from either a filesystem path or a file-like object.

    Django UploadedFile is consumed after a single read, so we materialise the
    bytes in memory and re-parse from BytesIO for each separator attempt below.
    """
    if isinstance(source, (str, Path)):
        return Path(source).read_bytes()

    # File-like (e.g. Django InMemoryUploadedFile, TemporaryUploadedFile)
    try:
        source.seek(0)
    except Exception:
        pass
    return source.read()


def read_csv_any(source: CsvSource) -> pd.DataFrame:
    """Read a CSV from a path or a file-like object, trying common separators."""
    raw = _read_bytes(source)

    for sep in [",", ";", "\t"]:
        try:
            df = pd.read_csv(io.BytesIO(raw), encoding="utf-8-sig", sep=sep)
            if df.shape[1] >= 2:
                return df
        except Exception:
            continue

    # Fallback: let pandas guess defaults
    return pd.read_csv(io.BytesIO(raw), encoding="utf-8-sig")


def ensure_columns(df: pd.DataFrame, mapping: dict[str, list[str]]) -> pd.DataFrame:
    """Rename columns case-insensitively.

    mapping: canonical_name -> list of possible source column names
    """

    cols_upper = {c.upper(): c for c in df.columns}

    def pick(cands: list[str]) -> str:
        for c in cands:
            if c.upper() in cols_upper:
                return cols_upper[c.upper()]
        raise KeyError(f"Missing required column. Tried: {cands}. Existing: {list(df.columns)}")

    out = df.copy()

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


def load_history_csv(source: CsvSource) -> pd.DataFrame:
    df = read_csv_any(source)
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


def load_future_reservations_csv(source: CsvSource) -> pd.DataFrame:
    df = read_csv_any(source)
    df = ensure_columns(
        df,
        {
            "reservation_theorique": ["reservation_theorique", "RESERVATION THEORIQUE"],
        },
    )
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df["reservation_theorique"] = pd.to_numeric(df["reservation_theorique"], errors="coerce")
    return df
