import { makeAutoObservable, runInAction } from "mobx";
import { getAxiosErrorMessage } from "@/api/client";
import {
  createForecast,
  deleteForecast,
  exportForecast,
  getForecast,
  getQuota,
  listForecasts,
  renameForecast,
  updateRowSupplement,
  type ExportFilters,
} from "@/features/forecasting/api/forecastApi";
import type {
  CreateForecastInput,
  ExportType,
  Forecast,
  ForecastRow,
  StorageQuota,
} from "@/features/forecasting/model/types";

const DEFAULT_PAGE_SIZE = 20;

type Pagination = {
  count: number;
  page: number;
  pageSize: number;
};

class ForecastStore {
  list: Forecast[] = [];
  pagination: Pagination = { count: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };

  currentForecast: Forecast | null = null;

  /** Quota de stockage utilisateur — null tant que pas chargé. */
  quota: StorageQuota | null = null;

  isLoadingList = false;
  isLoadingDetail = false;
  isCreating = false;
  isUpdatingRowId: number | null = null;
  isExporting = false;
  isDeletingId: number | null = null;
  isRenamingId: number | null = null;
  isBulkDeleting = false;

  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  get totalPages(): number {
    if (this.pagination.count === 0) return 1;
    return Math.ceil(this.pagination.count / this.pagination.pageSize);
  }

  clearError() {
    this.error = null;
  }

  reset() {
    this.list = [];
    this.pagination = { count: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE };
    this.currentForecast = null;
    this.quota = null;
    this.error = null;
  }

  /** Récupère l'état du quota. Silencieux en cas d'erreur — la barre est
   * juste un indicateur d'appoint, on ne veut pas casser la liste pour ça. */
  async fetchQuota(): Promise<void> {
    try {
      const quota = await getQuota();
      runInAction(() => {
        this.quota = quota;
      });
    } catch {
      /* on n'écrase pas le quota précédent ni `error` global */
    }
  }

  async fetchList(page = 1, pageSize = DEFAULT_PAGE_SIZE): Promise<void> {
    this.isLoadingList = true;
    this.error = null;
    try {
      const data = await listForecasts({ page, pageSize });
      runInAction(() => {
        this.list = data.results;
        this.pagination = { count: data.count, page, pageSize };
        this.isLoadingList = false;
      });
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isLoadingList = false;
      });
    }
  }

  async fetchDetail(id: number): Promise<void> {
    this.isLoadingDetail = true;
    this.error = null;
    try {
      const forecast = await getForecast(id);
      runInAction(() => {
        this.currentForecast = forecast;
        this.isLoadingDetail = false;
      });
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isLoadingDetail = false;
      });
    }
  }

  async create(input: CreateForecastInput): Promise<number | null> {
    this.isCreating = true;
    this.error = null;
    try {
      const forecast = await createForecast(input);
      runInAction(() => {
        this.currentForecast = forecast;
        this.isCreating = false;
      });
      void this.fetchQuota();
      return forecast.id;
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isCreating = false;
      });
      return null;
    }
  }

  /**
   * Optimistic update : on patch la valeur localement immédiatement,
   * on rollback si le serveur renvoie une erreur.
   */
  async updateRowSupplement(rowId: number, value: number): Promise<boolean> {
    const forecast = this.currentForecast;
    if (!forecast || !forecast.rows) return false;

    const row = forecast.rows.find((r) => r.id === rowId);
    if (!row) return false;

    const previousSupplement = row.supplement_humain;
    const previousFinal = row.final_amount;

    runInAction(() => {
      row.supplement_humain = value;
      row.final_amount = Math.max(row.amount_predicted + value, 0);
      this.isUpdatingRowId = rowId;
      this.error = null;
    });

    try {
      const updated = await updateRowSupplement(forecast.id, rowId, value);
      runInAction(() => {
        row.supplement_humain = updated.supplement_humain;
        row.final_amount = updated.final_amount;
        this.isUpdatingRowId = null;
      });
      return true;
    } catch (e) {
      runInAction(() => {
        row.supplement_humain = previousSupplement;
        row.final_amount = previousFinal;
        this.isUpdatingRowId = null;
        this.error = getAxiosErrorMessage(e);
      });
      return false;
    }
  }

  /**
   * Renomme une prévision (PATCH /forecasts/{id}/ avec `{title}`).
   * Met à jour à la fois la liste et la prévision courante si elle correspond.
   */
  async rename(id: number, title: string): Promise<boolean> {
    this.isRenamingId = id;
    this.error = null;
    try {
      const updated = await renameForecast(id, title);
      runInAction(() => {
        const indexInList = this.list.findIndex((f) => f.id === id);
        if (indexInList !== -1) {
          this.list[indexInList] = { ...this.list[indexInList], title: updated.title };
        }
        if (this.currentForecast?.id === id) {
          this.currentForecast = { ...this.currentForecast, title: updated.title };
        }
        this.isRenamingId = null;
      });
      return true;
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isRenamingId = null;
      });
      return false;
    }
  }

  async remove(id: number): Promise<boolean> {
    this.isDeletingId = id;
    this.error = null;
    try {
      await deleteForecast(id);
      runInAction(() => {
        this.list = this.list.filter((f) => f.id !== id);
        this.pagination.count = Math.max(this.pagination.count - 1, 0);
        if (this.currentForecast?.id === id) {
          this.currentForecast = null;
        }
        this.isDeletingId = null;
      });
      void this.fetchQuota();
      return true;
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isDeletingId = null;
      });
      return false;
    }
  }

  /**
   * Suppression en masse : DELETE en parallèle, on garde la liste finale
   * cohérente même si certains appels échouent. 
   */
  async removeMany(ids: number[]): Promise<{
    succeeded: number[];
    failed: { id: number; error: string }[];
  }> {
    if (ids.length === 0) return { succeeded: [], failed: [] };

    this.isBulkDeleting = true;
    this.error = null;

    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          await deleteForecast(id);
          return { id, ok: true as const };
        } catch (e) {
          return { id, ok: false as const, error: getAxiosErrorMessage(e) };
        }
      }),
    );

    const succeeded = results.filter((r) => r.ok).map((r) => r.id);
    const failed = results
      .filter((r): r is { id: number; ok: false; error: string } => !r.ok)
      .map((r) => ({ id: r.id, error: r.error }));

    runInAction(() => {
      const succeededSet = new Set(succeeded);
      this.list = this.list.filter((f) => !succeededSet.has(f.id));
      this.pagination.count = Math.max(
        this.pagination.count - succeeded.length,
        0,
      );
      if (
        this.currentForecast &&
        succeededSet.has(this.currentForecast.id)
      ) {
        this.currentForecast = null;
      }
      this.isBulkDeleting = false;
      if (failed.length > 0) {
        // On surface la première erreur pour les consommateurs qui lisent
        this.error = failed[0].error;
      }
    });

    if (succeeded.length > 0) {
      void this.fetchQuota();
    }
    return { succeeded, failed };
  }

  async exportToFile(
    id: number,
    type: ExportType,
    filters?: ExportFilters,
  ): Promise<boolean> {
    this.isExporting = true;
    this.error = null;
    try {
      const { blob, filename: serverFilename } = await exportForecast(id, type, filters);
      const isFiltered = !!(
        filters?.school ||
        filters?.dateFrom ||
        filters?.dateTo ||
        filters?.sortBy
      );
      const filename =
        serverFilename ??
        `previsions_repas_${id}${isFiltered ? "_filtre" : ""}.${type}`;
      triggerBrowserDownload(blob, filename);
      runInAction(() => {
        this.isExporting = false;
      });
      return true;
    } catch (e) {
      runInAction(() => {
        this.error = getAxiosErrorMessage(e);
        this.isExporting = false;
      });
      return false;
    }
  }

  /**
   * Mise à jour locale d'une row sans aller-retour serveur (utile pour le
   * recalcul des totaux avant l'envoi du PATCH).
   */
  patchRowLocal(rowId: number, patch: Partial<ForecastRow>) {
    const row = this.currentForecast?.rows?.find((r) => r.id === rowId);
    if (!row) return;
    Object.assign(row, patch);
  }
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const forecastStore = new ForecastStore();
export type { ForecastStore };
