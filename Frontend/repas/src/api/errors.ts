import axios, { type AxiosError } from "axios";

/**
 * Mappe les noms de champs back DRF vers un libellé FR lisible préfixé
 * à l'erreur. Permet de différencier "Historique" vs. "Réservations" dans
 * un toast quand on a deux uploads dans le même formulaire.
 */
const FIELD_LABELS: Record<string, string> = {
  history_file: "Historique",
  future_file: "Réservations futures",
  stock_tampon: "Stock tampon",
  title: "Titre",
};

function flattenDrfErrors(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (!data || typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  // DRF "detail" : message global (404, 401, permission, etc.).
  if (typeof obj.detail === "string") return obj.detail;
  if (Array.isArray(obj.detail)) {
    return obj.detail
      .map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: unknown }).msg) : String(x)))
      .join(", ");
  }

  // DRF field errors : { field: [msg, ...] | string }.
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const label = FIELD_LABELS[key] ?? key;
    if (typeof value === "string") {
      parts.push(`${label} : ${value}`);
    } else if (Array.isArray(value)) {
      const msgs = value.map((v) => (typeof v === "string" ? v : JSON.stringify(v)));
      parts.push(`${label} : ${msgs.join(" ")}`);
    } else if (value && typeof value === "object") {
      parts.push(`${label} : ${JSON.stringify(value)}`);
    }
  }
  return parts.length > 0 ? parts.join("\n") : null;
}

export function getAxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<unknown>;
    const flattened = flattenDrfErrors(ax.response?.data);
    if (flattened) return flattened;
    return ax.message;
  }
  return "Une erreur est survenue";
}
