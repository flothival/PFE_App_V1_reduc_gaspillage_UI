import { useEffect, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStores } from "@/stores/StoreContext";
import { PATHS, forecastDetailPath } from "@/routes/paths";

type FormErrors = {
  historyFile?: string;
  futureFile?: string;
  stockTampon?: string;
};

export const ForecastNewPage = observer(function ForecastNewPage() {
  const { forecastStore } = useStores();
  const navigate = useNavigate();

  const [historyFile, setHistoryFile] = useState<File | null>(null);
  const [futureFile, setFutureFile] = useState<File | null>(null);
  const [stockTampon, setStockTampon] = useState<string>("0");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const { isCreating, error: apiError } = forecastStore;

  useEffect(() => {
    forecastStore.clearError();
  }, [forecastStore]);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!historyFile) e.historyFile = "Fichier requis.";
    else if (!isCsvFile(historyFile)) e.historyFile = "Le fichier doit être un .csv";
    if (!futureFile) e.futureFile = "Fichier requis.";
    else if (!isCsvFile(futureFile)) e.futureFile = "Le fichier doit être un .csv";

    const stockValue = Number(stockTampon);
    if (!Number.isFinite(stockValue)) e.stockTampon = "Doit être un nombre.";
    else if (stockValue < 0) e.stockTampon = "Doit être positif ou nul.";
    return e;
  };

  const submitForm = async () => {
    const validation = validate();
    setErrors(validation);
    if (Object.keys(validation).length > 0) return;

    const id = await forecastStore.create({
      historyFile: historyFile!,
      futureFile: futureFile!,
      stockTampon: Number(stockTampon),
    });
    if (id !== null) {
      navigate(forecastDetailPath(id));
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(PATHS.FORECASTS)}
          disabled={isCreating}
        >
          <ArrowLeft aria-hidden />
          Retour à la liste
        </Button>
      </div>

      <div
        className={cn(
          "mt-6 flex flex-col gap-6 lg:flex-row lg:items-start",
          !isGuideOpen && "lg:justify-center",
        )}
      >
        <Card className="w-full lg:max-w-2xl lg:flex-1">
          <CardHeader>
            <CardTitle className="text-xl">Nouvelle prévision</CardTitle>
            <CardDescription>
              Importez l&apos;historique des repas servis et les réservations à venir.
              La génération peut prendre plusieurs secondes selon le volume de données.
            </CardDescription>
            <CardAction>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsGuideOpen((open) => !open)}
                aria-expanded={isGuideOpen}
                aria-controls="csv-guide-panel"
              >
                <BookOpen aria-hidden />
                {isGuideOpen ? "Fermer le guide" : "Guide CSV"}
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {apiError && (
              <Alert variant="destructive" className="mb-5">
                <AlertTitle>Erreur lors de la génération</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitForm();
              }}
              className={isCreating ? "pointer-events-none opacity-70" : undefined}
            >
              <FieldGroup>
                <Field data-invalid={!!errors.historyFile || undefined}>
                  <FieldLabel htmlFor="history-file">
                    Historique des repas (.csv)
                  </FieldLabel>
                  <FileDropZone
                    id="history-file"
                    name="history_file"
                    file={historyFile}
                    disabled={isCreating}
                    invalid={!!errors.historyFile}
                    onFileSelected={(file) => {
                      setHistoryFile(file);
                      setErrors((prev) => ({ ...prev, historyFile: undefined }));
                    }}
                  />
                  <FieldDescription>
                    Fichier des repas effectivement servis, utilisé pour l&apos;apprentissage.
                  </FieldDescription>
                  <FieldError>{errors.historyFile}</FieldError>
                </Field>

                <Field data-invalid={!!errors.futureFile || undefined}>
                  <FieldLabel htmlFor="future-file">
                    Réservations futures (.csv)
                  </FieldLabel>
                  <FileDropZone
                    id="future-file"
                    name="future_file"
                    file={futureFile}
                    disabled={isCreating}
                    invalid={!!errors.futureFile}
                    onFileSelected={(file) => {
                      setFutureFile(file);
                      setErrors((prev) => ({ ...prev, futureFile: undefined }));
                    }}
                  />
                  <FieldDescription>
                    Réservations théoriques pour la période à prédire.
                  </FieldDescription>
                  <FieldError>{errors.futureFile}</FieldError>
                </Field>

                <Field data-invalid={!!errors.stockTampon || undefined}>
                  <FieldLabel htmlFor="stock-tampon">Stock tampon</FieldLabel>
                  <Input
                    id="stock-tampon"
                    name="stock_tampon"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    disabled={isCreating}
                    value={stockTampon}
                    onChange={(e) => {
                      setStockTampon(e.target.value);
                      setErrors((prev) => ({ ...prev, stockTampon: undefined }));
                    }}
                    aria-invalid={!!errors.stockTampon || undefined}
                  />
                  <FieldDescription>
                    Marge de sécurité ajoutée à chaque commande (en nombre de repas).
                  </FieldDescription>
                  <FieldError>{errors.stockTampon}</FieldError>
                </Field>

                <Field orientation="horizontal" className="justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(PATHS.FORECASTS)}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden />
                        Génération en cours…
                      </>
                    ) : (
                      "Générer la prévision"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {isGuideOpen && (
          <aside
            id="csv-guide-panel"
            className="w-full lg:sticky lg:top-6 lg:w-[420px] lg:shrink-0"
          >
            <GuidePanel onClose={() => setIsGuideOpen(false)} />
          </aside>
        )}
      </div>
    </div>
  );
});

/* ============================================================
 * FileDropZone, input file enrichi avec glisser-déposer.
 * ============================================================ */

type FileDropZoneProps = {
  id: string;
  name: string;
  file: File | null;
  disabled?: boolean;
  invalid?: boolean;
  onFileSelected: (file: File | null) => void;
};

function FileDropZone({
  id,
  name,
  file,
  disabled,
  invalid,
  onFileSelected,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current += 1;
    if (e.dataTransfer.items.length > 0) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    // Indispensable pour autoriser le drop.
    e.preventDefault();
    if (!disabled) e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);
    if (disabled) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      onFileSelected(dropped);
      // Synchronise l'<input> sous-jacent pour rester accessible.
      if (inputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(dropped);
        inputRef.current.files = dt.files;
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onFileSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <label
      htmlFor={id}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed bg-background px-4 py-6 text-center text-sm transition-colors",
        "hover:border-primary/50 hover:bg-accent/40",
        isDragOver && "border-primary bg-accent",
        invalid && "border-destructive",
        disabled && "pointer-events-none cursor-not-allowed opacity-60",
      )}
    >
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="file"
        accept=".csv,text/csv"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
        aria-invalid={invalid || undefined}
      />

      {file ? (
        <div className="flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-left text-sm font-medium">{file.name}</p>
              <p className="text-left text-xs text-muted-foreground">
                {formatBytes(file.size)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Retirer le fichier"
          >
            <X aria-hidden />
          </Button>
        </div>
      ) : (
        <>
          <Upload className="size-5 text-muted-foreground" aria-hidden />
          <p className="font-medium">
            Glisser-déposer un fichier .csv ici
          </p>
          <p className="text-xs text-muted-foreground">
            ou cliquer pour parcourir
          </p>
        </>
      )}
    </label>
  );
}

/* ============================================================
 * GuidePanel : volet d'aide CSV (colonnes + exemples).
 * ============================================================ */

function GuidePanel({ onClose }: { onClose: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Format des fichiers CSV</CardTitle>
        <CardDescription>
          Colonnes attendues et exemples pour chaque fichier.
        </CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Fermer le guide"
          >
            <X aria-hidden />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 text-sm">
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">1. Historique des repas</h3>
          <p className="text-muted-foreground">
            Données passées utilisées pour entraîner le modèle.
          </p>
          <ColumnsList
            cols={[
              ["date", "Jour du repas (format YYYY-MM-DD)."],
              ["school", "Nom de l'école."],
              ["reservation_theorique", "Nombre de repas réservés."],
              ["presence_reel_eleve", "Nombre de repas réellement servis."],
            ]}
          />
          <ExampleTable
            headers={["date", "school", "reservation_theorique", "presence_reel_eleve"]}
            rows={[
              ["2025-09-01", "AKIRA KUROSAWA", "56", "56"],
              ["2025-09-01", "ALAIN SAVARY", "116", "112"],
              ["2025-09-02", "ALBRECHT", "58", "54"],
            ]}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">2. Réservations futures</h3>
          <p className="text-muted-foreground">
            Période à prédire. Mêmes écoles que l&apos;historique.
          </p>
          <ColumnsList
            cols={[
              ["date", "Jour à prédire (format YYYY-MM-DD)."],
              ["school", "Nom de l'école."],
              ["reservation_theorique", "Nombre de repas réservés pour ce jour."],
            ]}
          />
          <ExampleTable
            headers={["date", "school", "reservation_theorique"]}
            rows={[
              ["2025-11-03", "AKIRA KUROSAWA", "83"],
              ["2025-11-03", "ALAIN SAVARY", "130"],
              ["2025-11-04", "ALBRECHT", "73"],
            ]}
          />
        </section>

        <section className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-medium text-foreground">À noter</p>
          <ul className="list-disc pl-4">
            <li>Séparateurs acceptés : virgule, point-virgule, tabulation.</li>
            <li>Encodage UTF-8 (avec ou sans BOM).</li>
            <li>Les noms de colonnes ne sont pas sensibles à la casse.</li>
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}

function ColumnsList({ cols }: { cols: Array<[string, string]> }) {
  return (
    <ul className="flex flex-col gap-1">
      {cols.map(([name, desc]) => (
        <li key={name} className="flex flex-col">
          <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
            {name}
          </code>
          <span className="text-xs text-muted-foreground">{desc}</span>
        </li>
      ))}
    </ul>
  );
}

function ExampleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-hidden rounded-md border text-xs">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((h) => (
              <TableHead key={h} className="h-8 text-xs">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell key={j} className="py-1.5 font-mono text-xs">
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ============================================================
 * Helpers
 * ============================================================ */

function isCsvFile(file: File): boolean {
  return /\.csv$/i.test(file.name);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
