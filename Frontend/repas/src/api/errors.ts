import axios, { type AxiosError } from "axios";

export function getAxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ detail?: string | { msg?: string }[] }>;
    const data = ax.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const d = data.detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d)) {
        return d
          .map((x) => (typeof x === "object" && x && "msg" in x ? String(x.msg) : String(x)))
          .join(", ");
      }
    }
    return ax.message;
  }
  return "Une erreur est survenue";
}
