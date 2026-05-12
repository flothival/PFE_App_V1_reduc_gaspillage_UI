from __future__ import annotations

import io
from pathlib import Path
from typing import IO, Union

import pandas as pd

CsvSource = Union[str, Path, IO[bytes]]


class MissingCsvColumnError(ValueError):
    """Raised when a CSV is missing a required column.

    Carries the canonical column name, the accepted aliases, and the columns
    actually present, so the serializer can build a user-friendly message
    that names the specific missing column instead of a generic "400 Bad
    Request" from pandas.
    """

    def __init__(
        self,
        canonical: str,
        accepted: list[str],
        found: list[str],
    ) -> None:
        self.canonical = canonical
        self.accepted = accepted
        self.found = found
        super().__init__(
            f"Colonne « {canonical} » manquante. "
            f"Noms acceptés : {', '.join(accepted)}. "
            f"Colonnes trouvées : {', '.join(found) if found else '(aucune)'}."
        )


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
    found_cols = list(df.columns)

    def pick(canonical: str, cands: list[str]) -> str:
        for c in cands:
            if c.upper() in cols_upper:
                return cols_upper[c.upper()]
        raise MissingCsvColumnError(canonical, cands, found_cols)

    out = df.copy()

    out = out.rename(
        columns={
            pick("date", ["date", "DATE"]): "date",
            pick(
                "school",
                ["school", "SCHOOL", "JOIN_SCHOOL_STD", "JOIN_SCHOOL_STD_first"],
            ): "school",
        }
    )

    if "reservation_theorique" in mapping:
        out = out.rename(
            columns={
                pick(
                    "reservation_theorique", mapping["reservation_theorique"]
                ): "reservation_theorique"
            }
        )

    if "presence_reel_eleve" in mapping:
        out = out.rename(
            columns={
                pick(
                    "presence_reel_eleve", mapping["presence_reel_eleve"]
                ): "presence_reel_eleve"
            }
        )

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
