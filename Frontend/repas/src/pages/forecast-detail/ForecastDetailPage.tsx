import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import type { ExportType } from "@/features/forecasting/model/types";
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
import { forecastDisplayTitle } from "@/features/forecasting/model/types";
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

  // Polling auto tant que la prévision est en cours de génération côté back.
  // Refresh toutes les 3s, s'arrête dès que le statut passe à done ou error.
  const isPending = currentForecast?.status === "pending";
  useEffect(() => {
    if (!idIsValid || !isPending) return;
    const intervalId = window.setInterval(() => {
      void forecastStore.fetchDetail(id);
    }, POLLING_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [id, idIsValid, isPending, forecastStore]);

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
  const allRows = forecast.rows ?? [];
  const filters = useTableFilters(allRows);

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="w-fit min-w-0 max-w-full truncate border-b-4 border-b-[#51EDC6] pb-1 font-montpellier text-3xl font-bold tracking-[-0.025em] !leading-[1.25]">
            {forecastDisplayTitle(forecast)}
          </h1>
          <ForecastStatusBadge status={forecast.status} />
        </div>
        <div className="flex items-center gap-2">
          {forecast.status === "pending" && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={forecastStore.isLoadingDetail}>
              <RefreshCw
                className={cn("size-4", forecastStore.isLoadingDetail && "animate-spin")}
                aria-hidden
              />
              Rafraîchir
            </Button>
          )}
          {forecast.status === "done" && (
            <ExportButton
              forecastId={forecast.id}
              filters={filters}
              totalCount={allRows.length}
            />
          )}
          <DeleteForecastButton forecast={forecast} />
        </div>
      </header>

      <MetadataCard forecast={forecast} />

      {forecast.status === "pending" ? (
        <PendingState />
      ) : forecast.status === "error" ? (
        <ErrorState message={forecast.error_message ?? "Une erreur est survenue lors de la génération."} />
      ) : (
        <RowsTable allRows={allRows} filters={filters} />
      )}
    </>
  );
});

/* ============================================================
 * Bouton Supprimer (AlertDialog de confirmation)
 * ============================================================ */

const DeleteForecastButton = observer(function DeleteForecastButton({
  forecast,
}: {
  forecast: Forecast;
}) {
  const { forecastStore } = useStores();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isDeleting = forecastStore.isDeletingId === forecast.id;
  const label = forecastDisplayTitle(forecast);

  const handleConfirm = async () => {
    const ok = await forecastStore.remove(forecast.id);
    if (!ok) {
      toast({
        variant: "destructive",
        title: "Suppression impossible",
        description: forecastStore.error ?? "Une erreur est survenue.",
      });
      return;
    }
    toast({
      title: "Prévision supprimée",
      description: `« ${label} » a été supprimée.`,
    });
    setOpen(false);
    navigate(PATHS.FORECASTS);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm" disabled={isDeleting}>
          {isDeleting ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <Trash2 aria-hidden />
          )}
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-2 border-destructive">
        <AlertDialogHeader>
          <div className="mb-1 inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden />
          </div>
          <AlertDialogTitle className="text-destructive">
            Supprimer cette prévision ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            « {label} » et toutes ses lignes seront définitivement supprimées.
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              void handleConfirm();
            }}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="animate-spin" aria-hidden />}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

/* ============================================================
 * Bouton Export (dropdown CSV / XLSX)
 * ============================================================ */

type ExportScope = "all" | "filtered";

const ExportButton = observer(function ExportButton({
  forecastId,
  filters,
  totalCount,
}: {
  forecastId: number;
  filters: TableFilters;
  totalCount: number;
}) {
  const { forecastStore } = useStores();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ExportScope>("all");
  const [format, setFormat] = useState<ExportType>("csv");
  const [isBusy, setIsBusy] = useState(false);

  const { isFiltered, filterSummary, visibleRows } = filters;

  // Pré-sélectionne "filtré" quand on ouvre la modale avec un filtre actif.
  useEffect(() => {
    if (open) setScope(isFiltered ? "filtered" : "all");
  }, [open, isFiltered]);

  const handleConfirm = async () => {
    setIsBusy(true);
    try {
      const exportFilters =
        scope === "filtered"
          ? {
              school: filters.search.trim() || undefined,
              dateFrom: filters.dateFrom || undefined,
              dateTo: filters.dateTo || undefined,
              sortBy: filters.sort?.column,
              sortDir: filters.sort?.direction,
            }
          : undefined;

      const ok = await forecastStore.exportToFile(forecastId, format, exportFilters);
      if (!ok) {
        toast({
          variant: "destructive",
          title: "Échec de l'export",
          description: forecastStore.error ?? "Une erreur est survenue.",
        });
        return;
      }

      toast({
        title: "Export prêt",
        description: `Téléchargement du fichier .${format} démarré.`,
      });
      setOpen(false);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="font-montpellier">
          <Download aria-hidden />
          Exporter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exporter la prévision</DialogTitle>
          <DialogDescription>
            Choisissez le périmètre des données et le format du fichier.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {/* Périmètre */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Périmètre</Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as ExportScope)}
              className="gap-2"
            >
              <ScopeOption
                value="all"
                checked={scope === "all"}
                title="Tout"
                description={`Toutes les ${totalCount.toLocaleString("fr-FR")} lignes de la prévision.`}
              />
              <ScopeOption
                value="filtered"
                checked={scope === "filtered"}
                disabled={!isFiltered}
                title={isFiltered ? "Avec les filtres actuels" : "Avec les filtres actuels (aucun)"}
                description={
                  isFiltered ? (
                    <>
                      <ul className="space-y-0.5">
                        {filterSummary.map((s, i) => (
                          <li key={i}>· {s}</li>
                        ))}
                      </ul>
                      <p className="pt-1 text-xs font-medium text-foreground">
                        {visibleRows.length.toLocaleString("fr-FR")} ligne
                        {visibleRows.length > 1 ? "s" : ""} après filtre.
                      </p>
                    </>
                  ) : (
                    "Aucun filtre actif sur le tableau."
                  )
                }
              />
            </RadioGroup>
          </div>

          <Separator />

          {/* Format */}
          <div>
            <Label className="mb-2 block text-sm font-medium">Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportType)}
              className="grid grid-cols-2 gap-2"
            >
              <FormatOption
                value="csv"
                checked={format === "csv"}
                icon={FileText}
                title="CSV"
                hint=".csv"
              />
              <FormatOption
                value="xlsx"
                checked={format === "xlsx"}
                icon={FileSpreadsheet}
                title="Excel"
                hint=".xlsx"
              />
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isBusy}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isBusy}>
            {isBusy && <Loader2 className="animate-spin" aria-hidden />}
            Exporter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

function ScopeOption({
  value,
  checked,
  title,
  description,
  disabled,
}: {
  value: string;
  checked: boolean;
  title: string;
  description: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <Label
      htmlFor={`scope-${value}`}
      data-disabled={disabled || undefined}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <RadioGroupItem
        id={`scope-${value}`}
        value={value}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </Label>
  );
}

function FormatOption({
  value,
  checked,
  icon: Icon,
  title,
  hint,
}: {
  value: string;
  checked: boolean;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  hint: string;
}) {
  return (
    <Label
      htmlFor={`format-${value}`}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors",
        checked ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
      )}
    >
      <RadioGroupItem id={`format-${value}`} value={value} />
      <Icon
        className={cn("size-4", checked ? "text-primary" : "text-muted-foreground")}
        aria-hidden
      />
      <div className="flex flex-1 flex-col leading-tight">
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </div>
    </Label>
  );
}


// Bandeau métadonnées

function MetadataCard({ forecast }: { forecast: Forecast }) {
  return (
    <Card className="shadow-card-blue">
      <CardContent className="grid grid-cols-2 gap-4 py-5 md:grid-cols-4">
        <MetaItem
          label="Créée le"
          value={formatDateTime(forecast.created_at)}
        />
        <MetaItem
          label="Période"
          value={formatPeriod(forecast.predict_start, forecast.predict_end)}
        />
        <MetaItem
          label="Stock tampon"
          value={String(forecast.stock_tampon)}
          accent
        />
        <MetaItem
          label="Lignes"
          value={String(forecast.rows?.length ?? 0)}
          accent
        />
      </CardContent>
    </Card>
  );
}

function MetaItem({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-montpellier tabular-nums",
          accent
            ? "text-2xl font-extrabold tracking-[-0.025em] text-primary !leading-[1.1]"
            : "text-sm font-semibold",
        )}
      >
        {value}
      </span>
    </div>
  );
}

// Etats pending / error

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

// Table des lignes

/**
 * Seuil au-dessus duquel on bascule en rendu virtualisé.
 * En dessous, on rend la totalité du tableau (plus simple, fonctionne pour
 * Ctrl+F navigateur, sélection texte, etc.).
 */
const VIRTUALIZE_THRESHOLD = 50;

/** Hauteur estimée d'une ligne (px) — recalibrer si on change la densité de la table. */
const ESTIMATED_ROW_HEIGHT = 49;

/** Nombre de colonnes du tableau */
const COLUMN_COUNT = 7;

/** Intervalle de polling (ms) */
const POLLING_INTERVAL_MS = 3000;

type SortColumn = "date" | "school";
type SortDirection = "asc" | "desc";
type SortState = { column: SortColumn; direction: SortDirection } | null;

type SortProps = {
  sort: SortState;
  onToggle: (col: SortColumn) => void;
};

type TableFilters = {
  search: string;
  setSearch: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  sort: SortState;
  toggleSort: (col: SortColumn) => void;
  reset: () => void;
  visibleRows: ForecastRow[];
  isFiltered: boolean;
  filterSummary: string[];
};

/**
 * Hook qui encapsule l'état des filtres + tri du tableau et calcule les
 * `visibleRows` correspondantes. Mutualisé entre la table elle-même
 * et le bouton d'export (qui a besoin du même périmètre).
 */
function useTableFilters(allRows: ForecastRow[]): TableFilters {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const toggleSort = (col: SortColumn) => {
    setSort((current) => {
      if (current?.column !== col) return { column: col, direction: "asc" };
      if (current.direction === "asc") return { column: col, direction: "desc" };
      return null; // 3ᵉ clic → ordre d'origine
    });
  };

  const reset = () => {
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
    if (dateFrom) result = result.filter((r) => r.date >= dateFrom);
    if (dateTo) result = result.filter((r) => r.date <= dateTo);
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

  const isFiltered = !!search.trim() || !!dateFrom || !!dateTo || !!sort;

  const filterSummary = useMemo(() => {
    const items: string[] = [];
    if (search.trim()) items.push(`Recherche école : « ${search.trim()} »`);
    if (dateFrom && dateTo) {
      items.push(`Période : ${formatDateOnly(dateFrom)} → ${formatDateOnly(dateTo)}`);
    } else if (dateFrom) {
      items.push(`Période : à partir du ${formatDateOnly(dateFrom)}`);
    } else if (dateTo) {
      items.push(`Période : jusqu'au ${formatDateOnly(dateTo)}`);
    }
    if (sort) {
      const col = sort.column === "date" ? "Date" : "École";
      const dir = sort.direction === "asc" ? "croissant" : "décroissant";
      items.push(`Tri : ${col} (${dir})`);
    }
    return items;
  }, [search, dateFrom, dateTo, sort]);

  return {
    search, setSearch,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    sort, toggleSort,
    reset,
    visibleRows,
    isFiltered,
    filterSummary,
  };
}

function RowsTable({
  allRows,
  filters,
}: {
  allRows: ForecastRow[];
  filters: TableFilters;
}) {
  if (allRows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <FileText className="size-5" aria-hidden />
          </div>
          <p className="text-sm font-medium">Aucune ligne de prédiction</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Cette prévision ne contient pas de données. Vérifiez le fichier de
            réservations futures utilisé pour sa génération.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { visibleRows, isFiltered } = filters;
  const shouldVirtualize = visibleRows.length > VIRTUALIZE_THRESHOLD;
  const sortProps: SortProps = { sort: filters.sort, onToggle: filters.toggleSort };

  return (
    <Card className="overflow-hidden shadow-card-blue">
      <CardHeader>
        <CardTitle className="text-base">Détail par jour et par école</CardTitle>
        <CardDescription>
          Modifiez la colonne <strong>Supplément humain</strong> pour ajuster
          manuellement chaque ligne. Le total se recalcule automatiquement.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <TableToolbar
          search={filters.search}
          onSearchChange={filters.setSearch}
          dateFrom={filters.dateFrom}
          onDateFromChange={filters.setDateFrom}
          dateTo={filters.dateTo}
          onDateToChange={filters.setDateTo}
          isFiltered={isFiltered}
          onReset={filters.reset}
          visibleCount={visibleRows.length}
          totalCount={allRows.length}
          virtualized={shouldVirtualize}
        />
      </CardContent>

      <CardContent className="p-0">
        {visibleRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="size-5" aria-hidden />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-medium">Aucun résultat</p>
              <p className="text-xs text-muted-foreground">
                Aucune ligne ne correspond aux filtres actifs.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={filters.reset}>
              <X aria-hidden />
              Réinitialiser les filtres
            </Button>
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

// Toolbar (recherche + plage de dates + reset)

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
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Raccourci Ctrl+K / Cmd+K → focus la barre de recherche.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Rechercher une école…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 pr-14"
            aria-label="Rechercher une école"
          />
          <kbd
            className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex"
            aria-hidden
          >
            Ctrl K
          </kbd>
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

// Header de table avec colonnes triables

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

// Bodies (simple et virtualisé)

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

// Input éditable du supplement_humain

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
      // Valeur invalide : restaurer la dernière valeur connue.
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

// Helpers de format

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

