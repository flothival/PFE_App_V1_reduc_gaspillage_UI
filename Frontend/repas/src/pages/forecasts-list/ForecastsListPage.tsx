import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  LineChart,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { forecastDisplayTitle } from "@/features/forecasting/model/types";
import type { Forecast } from "@/features/forecasting/model/types";
import { useStores } from "@/stores/StoreContext";
import { PATHS, forecastDetailPath } from "@/routes/paths";

type SortDirection = "asc" | "desc";

/**
 * Page liste des prévisions.
 * - Fetch automatique au mount + à chaque changement de page.
 * - Lignes cliquables : page détail.
 * - Bouton "Nouvelle prévision" en haut à droite.
 */
export const ForecastsListPage = observer(function ForecastsListPage() {
  const { forecastStore } = useStores();
  const navigate = useNavigate();

  const { list, pagination, totalPages, isLoadingList, error } = forecastStore;

  // Tri client sur la colonne "Créée le". Par défaut, on garde l'ordre serveur
  // (décroissant) : premier clic = asc, deuxième = desc, troisième = reset.
  const [createdSort, setCreatedSort] = useState<SortDirection | null>(null);

  // Sélection multiple — scope page courante uniquement. On reset à chaque
  // changement de page, et après un bulk delete.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    void forecastStore.fetchList(pagination.page, pagination.pageSize);
    setSelectedIds(new Set());
  }, [pagination.page]);

  // Si la liste change (rename, fetch refresh), purge les IDs qui n'existent
  // plus pour éviter de garder une sélection fantôme.
  useEffect(() => {
    setSelectedIds((current) => {
      const stillExisting = new Set(list.map((f) => f.id));
      const cleaned = new Set<number>();
      for (const id of current) if (stillExisting.has(id)) cleaned.add(id);
      return cleaned.size === current.size ? current : cleaned;
    });
  }, [list]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    void forecastStore.fetchList(page, pagination.pageSize);
  };

  const sortedList = useMemo(() => {
    if (!createdSort) return list;
    const copy = [...list];
    copy.sort((a, b) => {
      const cmp = a.created_at.localeCompare(b.created_at);
      return createdSort === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [list, createdSort]);

  const toggleCreatedSort = () => {
    setCreatedSort((current) => {
      if (current === null) return "asc";
      if (current === "asc") return "desc";
      return null;
    });
  };

  const toggleRowSelection = (id: number, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(list.map((f) => f.id)) : new Set());
  };

  const headerCheckboxState: boolean | "indeterminate" =
    selectedIds.size === 0
      ? false
      : selectedIds.size === list.length
        ? true
        : "indeterminate";

  const isEmpty = !isLoadingList && list.length === 0 && !error;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="w-fit border-b-4 border-b-[#51EDC6] pb-1 font-montpellier text-3xl font-bold tracking-[-0.025em] !leading-[1.25]">
            Prévisions
          </h1>
          <p className="text-sm font-light text-muted-foreground">
            Liste de toutes les prévisions générées.
          </p>
        </div>
        <Button
          variant="success"
          size="lg"
          slideEffect
          onClick={() => navigate(PATHS.FORECAST_NEW)}
          className="font-montpellier"
        >
          <Plus aria-hidden />
          Nouvelle prévision
        </Button>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoadingList && list.length === 0 ? (
        <ListSkeleton />
      ) : isEmpty ? (
        <EmptyState onCreate={() => navigate(PATHS.FORECAST_NEW)} />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg bg-card shadow-card-blue">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={headerCheckboxState}
                      onCheckedChange={(value) => toggleSelectAll(value === true)}
                      aria-label={
                        headerCheckboxState === true
                          ? "Tout désélectionner"
                          : "Tout sélectionner"
                      }
                      disabled={list.length === 0}
                    />
                  </TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      onClick={toggleCreatedSort}
                      className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
                      aria-label="Trier par date de création"
                    >
                      Créée le
                      {createdSort === "asc" ? (
                        <ArrowUp className="size-3.5 text-primary" aria-hidden />
                      ) : createdSort === "desc" ? (
                        <ArrowDown className="size-3.5 text-primary" aria-hidden />
                      ) : (
                        <ArrowUpDown
                          className="size-3.5 text-muted-foreground/60"
                          aria-hidden
                        />
                      )}
                    </button>
                  </TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Stock tampon</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedList.map((forecast) => (
                  <ForecastRow
                    key={forecast.id}
                    forecast={forecast}
                    selected={selectedIds.has(forecast.id)}
                    onSelectedChange={(v) => toggleRowSelection(forecast.id, v)}
                    onClick={() => navigate(forecastDetailPath(forecast.id))}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <PaginationBar
            page={pagination.page}
            totalPages={totalPages}
            total={pagination.count}
            isLoading={isLoadingList}
            onPrev={() => goToPage(pagination.page - 1)}
            onNext={() => goToPage(pagination.page + 1)}
          />
        </>
      )}

      {selectedIds.size > 0 && (
        <BulkSelectionBar
          selectedIds={Array.from(selectedIds)}
          onClear={() => setSelectedIds(new Set())}
        />
      )}
    </div>
  );
});

// Barre flottante d'actions sur la sélection multiple

const BulkSelectionBar = observer(function BulkSelectionBar({
  selectedIds,
  onClear,
}: {
  selectedIds: number[];
  onClear: () => void;
}) {
  const { forecastStore } = useStores();
  const [open, setOpen] = useState(false);
  const count = selectedIds.length;

  const handleConfirm = async () => {
    const { succeeded, failed } = await forecastStore.removeMany(selectedIds);
    setOpen(false);
    if (succeeded.length > 0) {
      toast({
        title:
          succeeded.length > 1
            ? `${succeeded.length} prévisions supprimées`
            : "Prévision supprimée",
      });
    }
    if (failed.length > 0) {
      toast({
        variant: "destructive",
        title:
          failed.length > 1
            ? `${failed.length} suppressions ont échoué`
            : "Une suppression a échoué",
        description: failed[0]?.error,
      });
    }
    onClear();
  };

  return (
    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-lg">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium">
          {count} prévision{count > 1 ? "s" : ""} sélectionnée
          {count > 1 ? "s" : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={forecastStore.isBulkDeleting}>
          Annuler la sélection
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <Button
          variant="destructive"
          size="sm"
          disabled={forecastStore.isBulkDeleting}
          onClick={() => setOpen(true)}
        >
          {forecastStore.isBulkDeleting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Trash2 aria-hidden />
          )}
          Supprimer
        </Button>
        <AlertDialogContent className="border-2 border-destructive">
          <AlertDialogHeader>
            <div className="mb-1 inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" aria-hidden />
            </div>
            <AlertDialogTitle className="text-destructive">
              Supprimer {count} prévision{count > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {count > 1 ? "ces" : "cette"}{" "}
              {count} prévision{count > 1 ? "s" : ""} ? Toutes les lignes
              associées seront définitivement supprimées. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={forecastStore.isBulkDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
              disabled={forecastStore.isBulkDeleting}
            >
              {forecastStore.isBulkDeleting && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

const ForecastRow = observer(function ForecastRow({
  forecast,
  selected,
  onSelectedChange,
  onClick,
}: {
  forecast: Forecast;
  selected: boolean;
  onSelectedChange: (value: boolean) => void;
  onClick: () => void;
}) {
  return (
    <TableRow
      onClick={onClick}
      className="cursor-pointer"
      data-state={selected ? "selected" : undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <TableCell
        // La checkbox ne doit pas déclencher la navigation vers le détail.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelectedChange(v === true)}
          aria-label={`Sélectionner « ${forecastDisplayTitle(forecast)} »`}
        />
      </TableCell>
      <TableCell className="font-medium">
        {forecastDisplayTitle(forecast)}
      </TableCell>
      <TableCell>{formatDateTime(forecast.created_at)}</TableCell>
      <TableCell>{formatPeriod(forecast.predict_start, forecast.predict_end)}</TableCell>
      <TableCell className="text-right tabular-nums">{forecast.stock_tampon}</TableCell>
      <TableCell
        // Le menu kebab vit dans la ligne mais ne doit pas la déclencher.
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ForecastRowActions forecast={forecast} />
      </TableCell>
    </TableRow>
  );
});

// Menu d'actions sur une ligne (burger button) 


const ForecastRowActions = observer(function ForecastRowActions({
  forecast,
}: {
  forecast: Forecast;
}) {
  const { forecastStore } = useStores();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isBusy =
    forecastStore.isRenamingId === forecast.id ||
    forecastStore.isDeletingId === forecast.id;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions pour « ${forecastDisplayTitle(forecast)} »`}
            disabled={isBusy}
          >
            {isBusy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <MoreVertical className="size-4" aria-hidden />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <Pencil aria-hidden />
            Modifier le titre
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameForecastDialog
        forecast={forecast}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <DeleteForecastDialog
        forecast={forecast}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
});

// renommer une prévision

const RenameForecastDialog = observer(function RenameForecastDialog({
  forecast,
  open,
  onOpenChange,
}: {
  forecast: Forecast;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { forecastStore } = useStores();
  const [value, setValue] = useState(forecast.title);

  // Resynchronise quand on ouvre/change de prévision : sinon, un autre titre
  // mis à jour en arrière-plan reste affiché en valeur initiale.
  useEffect(() => {
    if (open) setValue(forecast.title);
  }, [open, forecast.title]);

  const isSaving = forecastStore.isRenamingId === forecast.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed === (forecast.title ?? "").trim()) {
      onOpenChange(false);
      return;
    }
    const ok = await forecastStore.rename(forecast.id, trimmed);
    if (!ok) {
      toast({
        variant: "destructive",
        title: "Renommage impossible",
        description: forecastStore.error ?? "Une erreur est survenue.",
      });
      return;
    }
    toast({
      title: "Titre modifié",
      description: trimmed
        ? `La prévision s'appelle maintenant « ${trimmed} ».`
        : "Le titre a été effacé.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le titre</DialogTitle>
            <DialogDescription>
              Renommez la prévision pour la retrouver plus facilement dans la liste.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor={`rename-input-${forecast.id}`}>Titre</Label>
            <Input
              id={`rename-input-${forecast.id}`}
              autoFocus
              maxLength={255}
              placeholder={`Prévision #${forecast.id}`}
              value={value}
              disabled={isSaving}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

// AlertDialog : supprimer une prévision (confirmation)

const DeleteForecastDialog = observer(function DeleteForecastDialog({
  forecast,
  open,
  onOpenChange,
}: {
  forecast: Forecast;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { forecastStore } = useStores();
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
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            {isDeleting && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

// ListSkeleton : Placeholder pour la liste des prévisions
function ListSkeleton() {
  return (
    <div className="rounded-md border">
      <div className="flex flex-col divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-3">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-muted/20 px-6 py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <LineChart className="size-8" aria-hidden />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">Aucune prévision pour l&apos;instant</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          Importez un historique de repas et un fichier de réservations futures
          pour générer votre première prévision automatique.
        </p>
      </div>
      <Button
        variant="success"
        size="lg"
        slideEffect
        onClick={onCreate}
        className="mt-1 font-montpellier"
      >
        <Plus aria-hidden />
        Créer ma première prévision
      </Button>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  isLoading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {total} prévision{total > 1 ? "s" : ""} · page {page} sur {totalPages}
        {isLoading && (
          <Loader2 className="ml-2 inline size-3 animate-spin align-[-2px]" aria-hidden />
        )}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isLoading}
          onClick={onPrev}
        >
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={onNext}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

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
