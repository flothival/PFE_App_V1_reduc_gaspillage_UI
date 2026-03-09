# app-semifinal — Prévision repas (Tkinter) + Supplement Humain

This folder is a **standalone** version of the app intended to be shared/reviewed.
It contains everything needed to run the application (code + sample data) without relying on other repo folders.

## What’s different vs the base app

This version adds a manual adjustment column:

- `Supplement Humain` (integer, can be negative)

Workflow is intentionally **2-steps**:

1) **Générer (prévision)** → computes predictions and shows them in the table
2) You edit **Supplement Humain** values (double-click the cell)
3) **Exporter CSV/XLSX** → exports *after* manual inputs are done

## Quick start (Windows)

### Option A — Double click

- Run `Launch_App.bat`

### Option B — Command line

From this folder:

```powershell
python -m pip install -r requirements.txt
python run_app.py
```

## Bundled sample files

This package ships with example data in `data/`:

- `data/training_history.csv` (history with real attendance)
- `data/example_future_reservations.csv` (future reservations to predict)
- `data/december_days/*.csv` (one CSV per day, optional convenience)

The app will prefill the 2 file inputs with the bundled samples.

## Input formats

### 1) History CSV (with real presence)

Required columns:
- `date`
- `school`
- `reservation_theorique`
- `presence_reel_eleve`

### 2) Future reservations CSV (to predict)

Required columns:
- `date`
- `school`
- `reservation_theorique`

Note: by default the app predicts only dates strictly **after** the last real date present in the history file.

## Output

When you click **Exporter CSV/XLSX**, files are written to `output/`:

- `previsions_repas_supplement_humain_YYYYMMDD_HHMMSS.csv`
- `previsions_repas_supplement_humain_YYYYMMDD_HHMMSS.xlsx`

Exported columns:
- `DATE`
- `ECOLE`
- `A PREPARER` (already includes Supplement Humain)
- `Supplement Humain`

## Notes

- `tkinterdnd2` is optional. If it’s missing, use the **Parcourir** buttons.
- Python itself is required (this package is **not** an EXE yet).
