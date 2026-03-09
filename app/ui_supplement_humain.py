from __future__ import annotations

import tkinter as tk
from dataclasses import dataclass
from datetime import datetime
import sys
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
from tkinter import simpledialog

import pandas as pd

from .io_utils import load_future_reservations_csv, load_history_csv
from .model import predict_reservations, train_learned_deltas
from .split_data import split_for_future, write_december_days
from .tuning import auto_tune_cfg


class ToolTip:
    def __init__(self, widget: tk.Widget, text: str):
        self.widget = widget
        self.text = text
        self._tip: tk.Toplevel | None = None

        widget.bind("<Enter>", self._show)
        widget.bind("<Leave>", self._hide)

    def _show(self, _event=None):
        if self._tip is not None:
            return

        x = self.widget.winfo_rootx() + 16
        y = self.widget.winfo_rooty() + self.widget.winfo_height() + 6

        tip = tk.Toplevel(self.widget)
        tip.wm_overrideredirect(True)
        tip.wm_geometry(f"+{x}+{y}")

        lbl = tk.Label(
            tip,
            text=self.text,
            justify="left",
            background="#ffffe0",
            relief="solid",
            borderwidth=1,
            font=("Segoe UI", 9),
            wraplength=560,
        )
        lbl.pack(ipadx=8, ipady=6)
        self._tip = tip

    def _hide(self, _event=None):
        if self._tip is None:
            return
        try:
            self._tip.destroy()
        finally:
            self._tip = None


def _try_import_dnd():
    try:
        from tkinterdnd2 import DND_FILES, TkinterDnD  # type: ignore

        return DND_FILES, TkinterDnD
    except Exception:
        return None, None


@dataclass
class AppState:
    history_path: str | None = None
    future_path: str | None = None
    learned_tbl: pd.DataFrame | None = None

    # Table used for preview + export
    preview_tbl: pd.DataFrame | None = None


class PredictorAppSupplementHumain:
    """Variant of AppV2 that supports a manual delta per (date, school).

    Flow:
    1) "Générer" computes model predictions and shows them in a table.
    2) User edits "Supplement Humain" cells.
    3) "Exporter" writes CSV/XLSX *after* manual inputs.
    """

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Prévision repas — appV2 (Supplement Humain)")
        self.state = AppState()

        self.stock_tampon_var = tk.IntVar(value=250)
        self.status_var = tk.StringVar(value="Prêt")

        # Tree row id -> index in preview_tbl
        self._tree_iid_to_idx: dict[str, int] = {}

        self._build_ui()
        self._prefill_with_bundled_samples()

    def _prefill_with_bundled_samples(self) -> None:
        data_dir = _runtime_root_dir() / "data"
        hist = data_dir / "training_history.csv"
        fut = data_dir / "example_future_reservations.csv"
        if hist.exists() and not self.state.history_path:
            self._set_history_path(str(hist))
        if fut.exists() and not self.state.future_path:
            self._set_future_path(str(fut))

    def _build_ui(self) -> None:
        frm = ttk.Frame(self.root, padding=12)
        frm.grid(row=0, column=0, sticky="nsew")

        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        frm.columnconfigure(1, weight=1)

        # Files
        ttk.Label(frm, text="1) Historique (avec présence réelle)").grid(
            row=0, column=0, columnspan=3, sticky="w"
        )

        self.history_entry = ttk.Entry(frm)
        self.history_entry.grid(row=1, column=0, columnspan=2, sticky="ew", padx=(0, 8))
        ttk.Button(frm, text="Parcourir", command=self._browse_history).grid(row=1, column=2, sticky="ew")

        help_hist = ttk.Label(frm, text="?", width=2, anchor="center")
        help_hist.grid(row=1, column=3, sticky="w", padx=(6, 0))
        ToolTip(
            help_hist,
            "Format attendu (CSV) :\n"
            "- colonnes obligatoires : date, school, reservation_theorique, presence_reel_eleve\n"
            "- 1 ligne = 1 école x 1 jour\n"
            "Exemple : 2026-02-12, ECOLE X, 120, 113",
        )

        ttk.Label(frm, text="2) Réservations futures (à prédire)").grid(
            row=2, column=0, columnspan=3, sticky="w", pady=(10, 0)
        )

        self.future_entry = ttk.Entry(frm)
        self.future_entry.grid(row=3, column=0, columnspan=2, sticky="ew", padx=(0, 8))
        ttk.Button(frm, text="Parcourir", command=self._browse_future).grid(row=3, column=2, sticky="ew")

        help_fut = ttk.Label(frm, text="?", width=2, anchor="center")
        help_fut.grid(row=3, column=3, sticky="w", padx=(6, 0))
        ToolTip(
            help_fut,
            "Format attendu (CSV) :\n"
            "- colonnes obligatoires : date, school, reservation_theorique\n"
            "- contient les jours à prédire (ex: 2026-02-20)\n"
            "Astuce : le logiciel ne prédit que les dates après la dernière date réelle de l'historique.",
        )

        # DnD hint
        dnd_hint = ttk.Label(frm, text="Astuce : glisser-déposer fonctionne si tkinterdnd2 est installé.")
        dnd_hint.grid(row=4, column=0, columnspan=3, sticky="w", pady=(4, 0))

        # Parameter exposed
        ttk.Separator(frm).grid(row=5, column=0, columnspan=3, sticky="ew", pady=12)
        params = ttk.Frame(frm)
        params.grid(row=6, column=0, columnspan=3, sticky="ew")
        params.columnconfigure(1, weight=1)
        ttk.Label(params, text="Stock tampon / jour (+)").grid(row=0, column=0, sticky="w")
        ttk.Entry(params, textvariable=self.stock_tampon_var, width=10).grid(row=0, column=1, sticky="w")

        help_stock = ttk.Label(params, text="?", width=2, anchor="center")
        help_stock.grid(row=0, column=2, sticky="w", padx=(6, 0))
        ToolTip(
            help_stock,
            "Ajoute une quantité fixe chaque jour (ex: 250).\n"
            "Cette quantité est incluse dans le total à préparer, mais n'apparaît pas comme une école.",
        )

        # Actions
        actions = ttk.Frame(frm)
        actions.grid(row=7, column=0, columnspan=3, sticky="ew", pady=(12, 0))
        ttk.Button(actions, text="Générer (prévision)", command=self._generate_preview).grid(
            row=0, column=0, padx=(0, 8)
        )
        self.export_btn = ttk.Button(actions, text="Exporter CSV/XLSX", command=self._export_files, state="disabled")
        self.export_btn.grid(row=0, column=1, padx=(0, 8))
        ttk.Button(actions, text="Quitter", command=self.root.destroy).grid(row=0, column=2)

        ttk.Label(frm, textvariable=self.status_var).grid(row=8, column=0, columnspan=3, sticky="w", pady=(8, 0))

        # Table
        ttk.Label(frm, text="Aperçu (double-clic sur 'Supplement Humain' pour ajuster)").grid(
            row=9, column=0, columnspan=3, sticky="w", pady=(10, 0)
        )
        self.tree = ttk.Treeview(frm, columns=("date", "school", "pred", "supp"), show="headings", height=12)
        self.tree.heading("date", text="DATE")
        self.tree.heading("school", text="ECOLE")
        self.tree.heading("pred", text="A PREPARER")
        self.tree.heading("supp", text="Supplement Humain")

        self.tree.column("date", width=120)
        self.tree.column("school", width=280)
        self.tree.column("pred", width=140, anchor="e")
        self.tree.column("supp", width=150, anchor="e")
        self.tree.grid(row=10, column=0, columnspan=3, sticky="nsew")
        frm.rowconfigure(10, weight=1)

        self.total_label = ttk.Label(frm, text="Résumé : —")
        self.total_label.grid(row=11, column=0, columnspan=3, sticky="w", pady=(8, 0))

        self.tree.bind("<Double-1>", self._on_double_click)

        self._enable_dnd_if_possible()

    def _enable_dnd_if_possible(self) -> None:
        DND_FILES, _ = _try_import_dnd()
        if DND_FILES is None:
            return

        def bind_drop(entry: ttk.Entry, setter):
            try:
                entry.drop_target_register(DND_FILES)  # type: ignore[attr-defined]
                entry.dnd_bind("<<Drop>>", lambda e: setter(e.data))  # type: ignore[attr-defined]
            except Exception:
                return

        bind_drop(self.history_entry, self._set_history_path)
        bind_drop(self.future_entry, self._set_future_path)

    def _set_history_path(self, data: str) -> None:
        path = data.strip("{}")
        self.state.history_path = path
        self.history_entry.delete(0, tk.END)
        self.history_entry.insert(0, path)

    def _set_future_path(self, data: str) -> None:
        path = data.strip("{}")
        self.state.future_path = path
        self.future_entry.delete(0, tk.END)
        self.future_entry.insert(0, path)

    def _browse_history(self) -> None:
        p = filedialog.askopenfilename(title="Choisir le CSV d'historique", filetypes=[("CSV", "*.csv"), ("Tous", "*")])
        if p:
            self._set_history_path(p)

    def _browse_future(self) -> None:
        p = filedialog.askopenfilename(title="Choisir le CSV de réservations futures", filetypes=[("CSV", "*.csv"), ("Tous", "*")])
        if p:
            self._set_future_path(p)

    def _generate_preview(self) -> None:
        if not self.state.history_path:
            messagebox.showerror("Fichier manquant", "Veuillez sélectionner le CSV d'historique.")
            return
        if not self.state.future_path:
            messagebox.showerror("Fichier manquant", "Veuillez sélectionner le CSV de réservations futures.")
            return

        try:
            self.export_btn.config(state="disabled")
            self.state.preview_tbl = None
            self._clear_tree()
            self._tree_iid_to_idx.clear()

            self.status_var.set("Chargement de l'historique…")
            self.root.update_idletasks()
            history = load_history_csv(self.state.history_path)

            self.status_var.set("Chargement des réservations futures…")
            self.root.update_idletasks()
            future_all = load_future_reservations_csv(self.state.future_path)

            self.status_var.set("Préparation (auto)…")
            self.root.update_idletasks()
            plan = split_for_future(history, future_all)

            # Optional export of december days if history contains them
            data_dir = _runtime_root_dir() / "data"
            dec_rows = history[pd.to_datetime(history["date"]).dt.month == 12].copy()
            if not dec_rows.empty:
                dec_path = data_dir / "december_data.csv"
                data_dir.mkdir(parents=True, exist_ok=True)
                dec_out = dec_rows[["date", "school", "reservation_theorique"]].copy()
                dec_out["date"] = pd.to_datetime(dec_out["date"]).dt.date.astype(str)
                dec_out.to_csv(dec_path, index=False, encoding="utf-8-sig")
                write_december_days(dec_rows[["date", "school", "reservation_theorique"]], data_dir / "december_days")

            stock = int(self.stock_tampon_var.get())

            self.status_var.set("Recherche du meilleur réglage…")
            self.root.update_idletasks()
            tuning = auto_tune_cfg(
                train_sep_oct=plan.train_tune,
                validate_nov=plan.validate,
                stock_tampon_per_day=stock,
                min_daily_net_floor=-300,
            )

            self.status_var.set(
                f"Réglage choisi : échelle={tuning.cfg.learned_delta_scale}, max_abs={tuning.cfg.learned_delta_max_abs}, "
                f"plancher={tuning.cfg.floor_ratio} | gâchis={tuning.total_waste}, pénurie={tuning.total_shortage}, "
                f"min_net={tuning.min_daily_net}"
            )
            self.root.update_idletasks()

            self.status_var.set("Entraînement sur l'historique…")
            self.root.update_idletasks()
            learned_tbl = train_learned_deltas(plan.train_final, tuning.cfg)
            self.state.learned_tbl = learned_tbl

            self.status_var.set(
                f"Prédiction : {plan.future_to_predict['date'].nunique()} jour(s) "
                f"du {plan.predict_start_date.date()} au {plan.predict_end_date.date()}…"
            )
            self.root.update_idletasks()

            preds = predict_reservations(plan.future_to_predict, learned_tbl, cfg=tuning.cfg)
            preds_out = preds.sort_values(["date", "school"]).reset_index(drop=True)

            # Prepare preview table with manual supplement
            tbl = preds_out[["date", "school", "amount_predicted"]].copy()
            tbl["Supplement Humain"] = 0
            tbl["A_PREPARER_FINAL"] = pd.to_numeric(tbl["amount_predicted"], errors="coerce").fillna(0).round().astype(int)

            tbl["date"] = pd.to_datetime(tbl["date"]).dt.date.astype(str)
            tbl["school"] = tbl["school"].astype(str)
            tbl["Supplement Humain"] = pd.to_numeric(tbl["Supplement Humain"], errors="coerce").fillna(0).round().astype(int)

            self.state.preview_tbl = tbl

            self._refresh_tree_from_state()
            self._update_totals_label(stock_per_day=stock)

            self.export_btn.config(state="normal")
            self.status_var.set("Ajustez 'Supplement Humain' puis cliquez Exporter.")
        except Exception as e:
            messagebox.showerror("Erreur", str(e))

    def _clear_tree(self) -> None:
        for row in self.tree.get_children():
            self.tree.delete(row)

    def _refresh_tree_from_state(self) -> None:
        self._clear_tree()
        self._tree_iid_to_idx.clear()

        tbl = self.state.preview_tbl
        if tbl is None or tbl.empty:
            return

        preview = tbl.head(1000).reset_index(drop=True)
        for idx, r in preview.iterrows():
            iid = self.tree.insert(
                "",
                tk.END,
                values=(r["date"], r["school"], int(r["A_PREPARER_FINAL"]), int(r["Supplement Humain"])),
            )
            self._tree_iid_to_idx[str(iid)] = int(idx)

    def _on_double_click(self, event) -> None:
        tbl = self.state.preview_tbl
        if tbl is None or tbl.empty:
            return

        region = self.tree.identify("region", event.x, event.y)
        if region != "cell":
            return

        col = self.tree.identify_column(event.x)  # e.g. '#4'
        # columns are: 1=date,2=school,3=pred(final),4=supp
        if col != "#4":
            return

        row_id = self.tree.identify_row(event.y)
        if not row_id:
            return

        idx = self._tree_iid_to_idx.get(str(row_id))
        if idx is None:
            return

        current = int(tbl.loc[idx, "Supplement Humain"])
        new_val = simpledialog.askinteger(
            "Supplement Humain",
            "Entrez un delta (peut être négatif) à ajouter à A PREPARER :",
            initialvalue=current,
            parent=self.root,
        )
        if new_val is None:
            return

        # Update table
        tbl.loc[idx, "Supplement Humain"] = int(new_val)
        base = int(pd.to_numeric(tbl.loc[idx, "amount_predicted"], errors="coerce"))
        final = base + int(new_val)
        if final < 0:
            final = 0
        tbl.loc[idx, "A_PREPARER_FINAL"] = int(final)

        # Update UI row
        values = list(self.tree.item(row_id, "values"))
        values[2] = int(final)
        values[3] = int(new_val)
        self.tree.item(row_id, values=values)

        stock = int(self.stock_tampon_var.get())
        self._update_totals_label(stock_per_day=stock)

    def _update_totals_label(self, *, stock_per_day: int) -> None:
        tbl = self.state.preview_tbl
        if tbl is None or tbl.empty:
            self.total_label.config(text="Résumé : —")
            return

        n_days = int(pd.to_datetime(tbl["date"]).nunique())
        total_ecoles = int(pd.to_numeric(tbl["A_PREPARER_FINAL"], errors="coerce").fillna(0).sum())
        total_stock = int(stock_per_day) * int(n_days)
        total_prepare = int(total_ecoles + total_stock)
        self.total_label.config(
            text=(
                f"Résumé : total à préparer = {total_prepare} "
                f"(écoles : {total_ecoles} + stock : {total_stock} = {stock_per_day}/jour × {n_days} jour(s))"
            )
        )

    def _export_files(self) -> None:
        tbl = self.state.preview_tbl
        if tbl is None or tbl.empty:
            messagebox.showerror("Rien à exporter", "Veuillez d'abord générer une prévision.")
            return

        try:
            out_dir = _runtime_root_dir() / "output"
            out_dir.mkdir(parents=True, exist_ok=True)
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            out_path = out_dir / f"previsions_repas_supplement_humain_{stamp}.csv"
            out_path_xlsx = out_dir / f"previsions_repas_supplement_humain_{stamp}.xlsx"

            out_csv = tbl[["date", "school", "A_PREPARER_FINAL", "Supplement Humain"]].copy()
            out_csv.rename(
                columns={
                    "date": "DATE",
                    "school": "ECOLE",
                    "A_PREPARER_FINAL": "A PREPARER",
                },
                inplace=True,
            )
            out_csv["DATE"] = pd.to_datetime(out_csv["DATE"]).dt.date.astype(str)
            out_csv["A PREPARER"] = pd.to_numeric(out_csv["A PREPARER"], errors="coerce").fillna(0).round().astype(int)
            out_csv["Supplement Humain"] = pd.to_numeric(out_csv["Supplement Humain"], errors="coerce").fillna(0).round().astype(int)
            out_csv = out_csv.sort_values(["DATE", "ECOLE"]).reset_index(drop=True)

            out_csv.to_csv(out_path, index=False, encoding="utf-8-sig")

            import openpyxl  # noqa: F401
            with pd.ExcelWriter(out_path_xlsx, engine="openpyxl") as writer:
                out_csv.to_excel(writer, sheet_name="prévisions", index=False)

            messagebox.showinfo(
                "Export terminé",
                f"Fichiers générés :\n- {out_path}\n- {out_path_xlsx}",
            )
        except Exception as e:
            messagebox.showerror("Erreur export", str(e))


def main() -> int:
    DND_FILES, TkinterDnD = _try_import_dnd()

    if TkinterDnD is not None:
        root = TkinterDnD.Tk()  # type: ignore
    else:
        root = tk.Tk()

    app = PredictorAppSupplementHumain(root)
    root.mainloop()
    return 0


def _runtime_root_dir() -> Path:
    """Return a stable, user-visible root directory.

    - Normal dev mode: folder containing appV2 (this file is app/ui_*.py)
    - Packaged mode (PyInstaller): folder containing the executable

    This ensures outputs land next to the EXE instead of a temp extraction dir.
    """
    if getattr(sys, "frozen", False) and hasattr(sys, "executable"):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[1]
