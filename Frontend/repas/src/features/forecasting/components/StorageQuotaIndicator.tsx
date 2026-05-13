import { observer } from "mobx-react-lite";
import { HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StorageQuota } from "@/features/forecasting/model/types";

type Props = {
  quota: StorageQuota | null;
  className?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} Ko`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} Mo`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} Go`;
}

/**
 * Indicateur de quota de stockage CSV 
 *  - < 80 %  → turquoise success
 *  - 80-95 % → orange warning
 *  - > 95 %  → destructive

 */
export const StorageQuotaIndicator = observer(function StorageQuotaIndicator({
  quota,
  className,
}: Props) {
  if (!quota) return null;

  const { used_bytes, max_bytes } = quota;
  const ratio = max_bytes > 0 ? Math.min(used_bytes / max_bytes, 1) : 0;
  const percent = ratio * 100;

  const status =
    ratio >= 0.95 ? "destructive" : ratio >= 0.8 ? "warning" : "ok";

  const barFill = {
    ok: "bg-[#00D9B5]",
    warning: "bg-[#F59E0B]",
    destructive: "bg-destructive",
  }[status];

  return (
    <div
      className={cn(
        "flex items-center gap-3 text-xs",
        className,
      )}
      title={`Stockage utilisé : ${Math.round(percent)} %`}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <HardDrive className="size-3.5 shrink-0" aria-hidden />
        <span className="font-montpellier uppercase tracking-wider">
          Stockage
        </span>
      </div>
      <span className="font-montpellier font-semibold tabular-nums text-foreground">
        {formatBytes(used_bytes)} / {formatBytes(max_bytes)}
      </span>
      <div
        className="h-1.5 w-32 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-label={`Quota de stockage : ${Math.round(percent)} % utilisé`}
      >
        <div
          className={cn("h-full transition-all duration-300", barFill)}
          style={{ width: `${percent.toFixed(2)}%` }}
        />
      </div>
    </div>
  );
});
