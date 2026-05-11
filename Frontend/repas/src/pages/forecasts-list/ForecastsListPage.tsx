import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { ChevronRight, Loader2, Plus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import type { Forecast } from "@/features/forecasting/model/types";
import { useStores } from "@/stores/StoreContext";
import { PATHS, forecastDetailPath } from "@/routes/paths";

/**
 * Page liste des prévisions.
 * - Fetch automatique au mount + à chaque changement de page.
 * - Lignes cliquables → page détail.
 * - Bouton "Nouvelle prévision" en haut à droite.
 */
export const ForecastsListPage = observer(function ForecastsListPage() {
  const { forecastStore } = useStores();
  const navigate = useNavigate();

  const { list, pagination, totalPages, isLoadingList, error } = forecastStore;

  useEffect(() => {
    void forecastStore.fetchList(pagination.page, pagination.pageSize);
    // On veut refetch quand la page change. pageSize est fixe pour l'instant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    void forecastStore.fetchList(page, pagination.pageSize);
  };

  const isEmpty = !isLoadingList && list.length === 0 && !error;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prévisions</h1>
          <p className="text-sm text-muted-foreground">
            Liste de toutes les prévisions générées.
          </p>
        </div>
        <Button onClick={() => navigate(PATHS.FORECAST_NEW)}>
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Créée le</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Stock tampon</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((forecast) => (
                  <ForecastRow
                    key={forecast.id}
                    forecast={forecast}
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
    </div>
  );
});

function ForecastRow({
  forecast,
  onClick,
}: {
  forecast: Forecast;
  onClick: () => void;
}) {
  return (
    <TableRow
      onClick={onClick}
      className="cursor-pointer"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <TableCell className="font-medium">#{forecast.id}</TableCell>
      <TableCell>{formatDateTime(forecast.created_at)}</TableCell>
      <TableCell>{formatPeriod(forecast.predict_start, forecast.predict_end)}</TableCell>
      <TableCell className="text-right tabular-nums">{forecast.stock_tampon}</TableCell>
      <TableCell>
        <ForecastStatusBadge status={forecast.status} />
      </TableCell>
      <TableCell className="text-muted-foreground">
        <ChevronRight className="size-4" aria-hidden />
      </TableCell>
    </TableRow>
  );
}

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
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-16 text-center">
      <p className="text-base font-medium">Aucune prévision pour l&apos;instant</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Importez un historique et un fichier de réservations futures pour générer
        votre première prévision.
      </p>
      <Button onClick={onCreate} className="mt-2">
        <Plus aria-hidden />
        Créer une prévision
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
