import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ForecastStatusBadge } from "@/features/forecasting/components/ForecastStatusBadge";
import type {
  Forecast,
  ForecastRow,
} from "@/features/forecasting/model/types";
import { useStores } from "@/stores/StoreContext";
import { PATHS } from "@/routes/paths";

export const ForecastDetailPage = observer(function ForecastDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const { forecastStore } = useStores();
  const navigate = useNavigate();

  const { currentForecast, isLoadingDetail, error } = forecastStore;

  const id = Number(idParam);
  const idIsValid = Number.isFinite(id) && id > 0;

  useEffect(() => {
    if (!idIsValid) return;
    void forecastStore.fetchDetail(id);
  }, [id, idIsValid, forecastStore]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(PATHS.FORECASTS)}
        >
          <ArrowLeft aria-hidden />
          Retour à la liste
        </Button>
      </div>

      {!idIsValid ? (
        <Alert variant="destructive">
          <AlertTitle>Identifiant invalide</AlertTitle>
          <AlertDescription>L&apos;URL ne pointe pas vers une prévision valide.</AlertDescription>
        </Alert>
      ) : error && !currentForecast ? (
        <Alert variant="destructive">
          <AlertTitle>Erreur de chargement</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : isLoadingDetail && !currentForecast ? (
        <DetailSkeleton />
      ) : currentForecast ? (
        <ForecastDetailContent forecast={currentForecast} onRefresh={() => forecastStore.fetchDetail(id)} />
      ) : null}
    </div>
  );
});

/* ============================================================
 * Contenu principal — bandeau métadonnées + tableau (ou état pending/error).
 * ============================================================ */

const ForecastDetailContent = observer(function ForecastDetailContent({
  forecast,
  onRefresh,
}: {
  forecast: Forecast;
  onRefresh: () => void;
}) {
  const { forecastStore } = useStores();

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Prévision #{forecast.id}
          </h1>
          <ForecastStatusBadge status={forecast.status} />
        </div>
        {forecast.status === "pending" && (
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={forecastStore.isLoadingDetail}>
            <RefreshCw
              className={cn("size-4", forecastStore.isLoadingDetail && "animate-spin")}
              aria-hidden
            />
            Rafraîchir
          </Button>
        )}
      </header>

      <MetadataCard forecast={forecast} />

      {forecast.status === "pending" ? (
        <PendingState />
      ) : forecast.status === "error" ? (
        <ErrorState message={forecast.error_message ?? "Une erreur est survenue lors de la génération."} />
      ) : (
        <RowsTable rows={forecast.rows ?? []} />
      )}
    </>
  );
});

/* ============================================================
 * Bandeau métadonnées
 * ============================================================ */

function MetadataCard({ forecast }: { forecast: Forecast }) {
  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-4 py-5 md:grid-cols-4">
        <MetaItem label="Créée le" value={formatDateTime(forecast.created_at)} />
        <MetaItem
          label="Période"
          value={formatPeriod(forecast.predict_start, forecast.predict_end)}
        />
        <MetaItem label="Stock tampon" value={String(forecast.stock_tampon)} />
        <MetaItem label="Lignes" value={String(forecast.rows?.length ?? 0)} />
      </CardContent>
    </Card>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/* ============================================================
 * Etats pending / error
 * ============================================================ */

function PendingState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-base font-medium">Génération en cours…</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Le serveur entraîne le modèle et calcule les prédictions. Cela peut
          prendre quelques secondes à plusieurs minutes selon le volume.
        </p>
      </CardContent>
    </Card>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Génération en échec</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/* ============================================================
 * Table des lignes
 * ============================================================ */

/**
 * Seuil au-dessus duquel on bascule en rendu virtualisé.
 * En dessous, on rend la totalité du tableau (plus simple, fonctionne pour
 * Ctrl+F navigateur, sélection texte, etc.).
 */
const VIRTUALIZE_THRESHOLD = 2000;

/** Hauteur estimée d'une ligne (px) — recalibrer si on change la densité de la table. */
const ESTIMATED_ROW_HEIGHT = 49;

/** Nombre de colonnes du tableau — utilisé pour les `colSpan` des spacers virtualisés. */
const COLUMN_COUNT = 7;

type SortColumn = "date" | "school";
type SortDirection = "asc" | "desc";
type SortState = { column: SortColumn; direction: SortDirection } | null;

type SortProps = {
  sort: SortState;
  onToggle: (col: SortColumn) => void;
};

function RowsTable({ rows: allRows }: { rows: ForecastRow[] }) {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const handleToggleSort = (col: SortColumn) => {
    setSort((current) => {
      if (current?.column !== col) return { column: col, direction: "asc" };
      if (current.direction === "asc") return { column: col, direction: "desc" };
      return null; // 3ᵉ clic → on remet l'ordre d'origine
    });
  };

  const handleReset = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSort(null);
  };

  const visibleRows = useMemo(() => {
    let result = allRows;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((r) => r.school.toLowerCase().includes(q));
    }
    if (dateFrom) {
      result = result.filter((r) => r.date >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((r) => r.date <= dateTo);
    }

    if (sort) {
      const sorted = [...result];
      sorted.sort((a, b) => {
        const cmp =
          sort.column === "date"
            ? a.date.localeCompare(b.date)
            : a.school.localeCompare(b.school, "fr");
        return sort.direction === "asc" ? cmp : -cmp;
      });
      result = sorted;
    }

    return result;
  }, [allRows, search, dateFrom, dateTo, sort]);

  if (allRows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Aucune ligne de prédiction.
        </CardContent>
      </Card>
    );
  }

  const isFiltered = !!search.trim() || !!dateFrom || !!dateTo || !!sort;
  const shouldVirtualize = visibleRows.length > VIRTUALIZE_THRESHOLD;
  const sortProps: SortProps = { sort, onToggle: handleToggleSort };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">Détail par jour et par école</CardTitle>
        <CardDescription>
          Modifiez la colonne <strong>Supplément humain</strong> pour ajuster
          manuellement chaque ligne. Le total se recalcule automatiquement.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          isFiltered={isFiltered}
          onReset={handleReset}
          visibleCount={visibleRows.length}
          totalCount={allRows.length}
          virtualized={shouldVirtualize}
        />
      </CardContent>

      <CardContent className="p-0">
        {visibleRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aucune ligne ne correspond aux filtres.
          </div>
        ) : shouldVirtualize ? (
          <VirtualizedRowsBody rows={visibleRows} sortProps={sortProps} />
        ) : (
          <SimpleRowsBody rows={visibleRows} sortProps={sortProps} />
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------
 * Toolbar (recherche + plage de dates + reset)
 * ------------------------------------------------------------ */

function TableToolbar({
  search,
  onSearchChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  isFiltered,
  onReset,
  visibleCount,
  totalCount,
  virtualized,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  isFiltered: boolean;
  onReset: () => void;
  visibleCount: number;
  totalCount: number;
  virtualized: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Rechercher une école…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
            aria-label="Rechercher une école"
          />
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              Du
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              Au
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X aria-hidden />
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        {isFiltered
          ? `${visibleCount.toLocaleString("fr-FR")} / ${totalCount.toLocaleString("fr-FR")} lignes`
          : `${totalCount.toLocaleString("fr-FR")} lignes`}
        {virtualized && " · affichage virtualisé"}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
 * Header de table avec colonnes triables
 * ------------------------------------------------------------ */

function RowsTableHeader({ sortProps }: { sortProps: SortProps }) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-card">
      <TableRow>
        <SortableHead
          column="date"
          label="Date"
          sortProps={sortProps}
          className="w-28"
        />
        <SortableHead column="school" label="École" sortProps={sortProps} />
        <TableHead className="text-right">Réservation théo.</TableHead>
        <TableHead className="text-right">Δ appris</TableHead>
        <TableHead className="text-right">Prédit</TableHead>
        <TableHead className="w-36 text-right">Supplément humain</TableHead>
        <TableHead className="text-right">Total</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function SortableHead({
  column,
  label,
  sortProps,
  className,
}: {
  column: SortColumn;
  label: string;
  sortProps: SortProps;
  className?: string;
}) {
  const isActive = sortProps.sort?.column === column;
  const direction = isActive ? sortProps.sort!.direction : null;

  const Icon =
    direction === "asc" ? ArrowUp : direction === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => sortProps.onToggle(column)}
        className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
        aria-label={`Trier par ${label}`}
      >
        {label}
        <Icon
          className={
            isActive ? "size-3.5 text-primary" : "size-3.5 text-muted-foreground/60"
          }
          aria-hidden
        />
      </button>
    </TableHead>
  );
}

/* ------------------------------------------------------------
 * Bodies (simple et virtualisé)
 * ------------------------------------------------------------ */

function SimpleRowsBody({
  rows,
  sortProps,
}: {
  rows: ForecastRow[];
  sortProps: SortProps;
}) {
  return (
    <div className="max-h-[70vh] overflow-auto">
      <Table>
        <RowsTableHeader sortProps={sortProps} />
        <TableBody>
          {rows.map((row) => (
            <RowLine key={row.id} row={row} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function VirtualizedRowsBody({
  rows,
  sortProps,
}: {
  rows: ForecastRow[];
  sortProps: SortProps;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: 10,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualItems[0]?.start ?? 0;
  const paddingBottom =
    virtualItems.length > 0
      ? totalSize - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div ref={parentRef} className="max-h-[70vh] overflow-auto">
      <Table>
        <RowsTableHeader sortProps={sortProps} />
        <TableBody>
          {paddingTop > 0 && (
            <tr aria-hidden>
              <td
                colSpan={COLUMN_COUNT}
                style={{ height: paddingTop, padding: 0, border: 0 }}
              />
            </tr>
          )}
          {virtualItems.map((virtualRow) => (
            <RowLine
              key={rows[virtualRow.index].id}
              row={rows[virtualRow.index]}
            />
          ))}
          {paddingBottom > 0 && (
            <tr aria-hidden>
              <td
                colSpan={COLUMN_COUNT}
                style={{ height: paddingBottom, padding: 0, border: 0 }}
              />
            </tr>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

const RowLine = observer(function RowLine({ row }: { row: ForecastRow }) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{formatDateOnly(row.date)}</TableCell>
      <TableCell>{row.school}</TableCell>
      <TableCell className="text-right tabular-nums">{row.reservation_theorique}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {formatDelta(row.delta_learned)}
      </TableCell>
      <TableCell className="text-right tabular-nums">{row.amount_predicted}</TableCell>
      <TableCell className="text-right">
        <SupplementInput row={row} />
      </TableCell>
      <TableCell className="text-right font-bold tabular-nums">
        {row.final_amount}
      </TableCell>
    </TableRow>
  );
});

/* ============================================================
 * Input éditable du supplement_humain (save onBlur / Enter).
 * ============================================================ */

const SupplementInput = observer(function SupplementInput({
  row,
}: {
  row: ForecastRow;
}) {
  const { forecastStore } = useStores();
  const [value, setValue] = useState<string>(String(row.supplement_humain));
  const inputRef = useRef<HTMLInputElement>(null);

  // Resynchronise si la valeur change côté store (ex: rollback après erreur API,
  // ou réponse serveur qui ajuste la valeur).
  useEffect(() => {
    setValue(String(row.supplement_humain));
  }, [row.supplement_humain]);

  const isUpdating = forecastStore.isUpdatingRowId === row.id;

  const commit = () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      // Valeur invalide → restaurer la dernière valeur connue.
      setValue(String(row.supplement_humain));
      return;
    }
    if (parsed === row.supplement_humain) return;
    void forecastStore.updateRowSupplement(row.id, parsed);
  };

  return (
    <div className="relative inline-flex items-center justify-end">
      <Input
        ref={inputRef}
        type="number"
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            inputRef.current?.blur();
          } else if (e.key === "Escape") {
            e.preventDefault();
            setValue(String(row.supplement_humain));
            inputRef.current?.blur();
          }
        }}
        disabled={isUpdating}
        className="h-8 w-24 text-right tabular-nums"
      />
      {isUpdating && (
        <Loader2
          className="absolute -left-5 size-3 animate-spin text-muted-foreground"
          aria-hidden
        />
      )}
    </div>
  );
});

/* ============================================================
 * Skeleton de chargement
 * ============================================================ */

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-48" />
      <Card>
        <CardContent className="grid grid-cols-2 gap-4 py-5 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex flex-col gap-2 py-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full" />
          ))}
        </CardContent>
      </Card>
    </>
  );
}

/* ============================================================
 * Helpers de format
 * ============================================================ */

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  return `${formatDateOnly(start)} → ${formatDateOnly(end)}`;
}

/** "2025-03-15" → "15/03/2025" (évite tout glissement de timezone). */
function formatDateOnly(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatDelta(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const rounded = n.toFixed(1);
  return n > 0 ? `+${rounded}` : rounded;
}
