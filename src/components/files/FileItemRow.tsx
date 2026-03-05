import React from "react";
import type { WizardDocument } from "../../types";

interface FileItemRowProps {
  doc: WizardDocument;
  previewUrl?: string;
  onRemove: () => void;
  onPreview?: (doc: WizardDocument, previewUrl?: string) => void;
}

function formatFileSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / 1024).toFixed(1)} KB`;
}

function getFileTypeLabel(doc: WizardDocument): string {
  if (doc.file?.type) return doc.file.type;
  const parts = doc.name.split(".");
  const ext = parts.length > 1 ? parts.pop() : "";
  return ext ? ext.toUpperCase() : "Archivo";
}

export const FileItemRow: React.FC<FileItemRowProps> = ({
  doc,
  previewUrl,
  onRemove,
  onPreview
}) => {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (doc.status !== "EN_VALIDACION") return;
    const interval = window.setInterval(() => setTick((prev) => prev + 1), 220);
    return () => window.clearInterval(interval);
  }, [doc.status]);

  const elapsedMs =
    doc.status === "EN_VALIDACION"
      ? Math.max(0, Date.now() - (doc.validationStartedAt ?? Date.now()))
      : 0;
  const processingStage =
    elapsedMs < 900 ? "Procesando..." : elapsedMs < 1800 ? "Analizando..." : "Validando...";
  const progress =
    doc.status === "VALIDO"
      ? 100
      : doc.status === "INVALIDO"
      ? 100
      : elapsedMs < 900
      ? 32
      : elapsedMs < 1800
      ? 68
      : 88 + ((tick % 3) * 2);

  const statusLabel =
    doc.status === "EN_VALIDACION"
      ? processingStage
      : doc.status === "VALIDO"
      ? "Validado"
      : "Inválido";
  const statusColor =
    doc.status === "EN_VALIDACION"
      ? "bg-brand-ink/10 text-brand-ink animate-pulse"
      : doc.status === "VALIDO"
      ? "bg-success/10 text-success"
      : "bg-error/10 text-error";
  const progressBarColor =
    doc.status === "VALIDO"
      ? "bg-success"
      : doc.status === "INVALIDO"
      ? "bg-error"
      : "bg-brand-ink";

  const isImage = !!doc.file?.type?.startsWith("image/");
  const isPdf = doc.file?.type === "application/pdf" || doc.name.toLowerCase().endsWith(".pdf");
  const pdfPreviewUrl = previewUrl ? `${previewUrl}#page=1&view=FitH` : "";

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-brand-border bg-brand-surface p-3 text-xs shadow-sm transition hover:border-brand-ink/20 hover:shadow-md">
      <div className="h-20 w-28 overflow-hidden rounded-lg border border-brand-border bg-white sm:h-24 sm:w-32">
        {isImage && previewUrl && (
          <img
            src={previewUrl}
            alt={`Vista previa de ${doc.name}`}
            className="h-full w-full object-contain"
          />
        )}
        {isPdf && previewUrl && (
          <object data={pdfPreviewUrl} type="application/pdf" className="h-full w-full">
            <div className="flex h-full items-center justify-center text-[11px] text-brand-muted">
              PDF
            </div>
          </object>
        )}
        {!isImage && !isPdf && (
          <div className="flex h-full items-center justify-center text-[11px] text-brand-muted">
            Archivo
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="truncate font-medium text-brand-ink">{doc.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
            {doc.status === "EN_VALIDACION" && (
              <span className="mr-1 inline-block h-2.5 w-2.5 animate-spin rounded-full border border-brand-ink border-t-transparent align-[-1px]" />
            )}
            {statusLabel}
          </span>
        </div>
        {doc.errorDetail && <span className="mt-1 block text-[11px] text-error">{doc.errorDetail}</span>}
        <span className="mt-1 block text-[11px] text-brand-muted">
          {formatFileSize(doc.size)} • {getFileTypeLabel(doc)}
        </span>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand-border/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-3">
          {previewUrl && (
            <button
              type="button"
              onClick={() =>
                onPreview
                  ? onPreview(doc, previewUrl)
                  : window.open(previewUrl, "_blank", "noopener,noreferrer")
              }
              className="text-[11px] font-medium text-brand-ink underline-offset-2 hover:underline"
            >
              Ver
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="text-[11px] text-brand-muted hover:text-error"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
