import React from "react";
import type { WizardDocument } from "../../types";

interface FileItemRowProps {
  doc: WizardDocument;
  previewUrl?: string;
  onRemove: () => void;
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

export const FileItemRow: React.FC<FileItemRowProps> = ({ doc, previewUrl, onRemove }) => {
  const statusLabel =
    doc.status === "EN_VALIDACION"
      ? "En validación"
      : doc.status === "VALIDO"
      ? "Válido"
      : "Documento no corresponde";
  const statusColor =
    doc.status === "EN_VALIDACION"
      ? "bg-brand-ink/10 text-brand-ink"
      : doc.status === "VALIDO"
      ? "bg-success/10 text-success"
      : "bg-error/10 text-error";

  const categoryLabel =
    doc.category === "FACTURA"
      ? "Factura"
      : doc.category === "MEDICO"
      ? "Informe/receta"
      : "Evidencia adicional";
  const isImage = !!doc.file?.type?.startsWith("image/");
  const isPdf = doc.file?.type === "application/pdf" || doc.name.toLowerCase().endsWith(".pdf");
  const pdfPreviewUrl = previewUrl ? `${previewUrl}#page=1&view=FitH` : "";

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-brand-border bg-brand-surface p-3 text-xs">
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
            {statusLabel}
          </span>
        </div>
        {doc.errorDetail && <span className="mt-1 block text-[11px] text-error">{doc.errorDetail}</span>}
        <span className="mt-1 block text-[11px] text-brand-muted">
          {categoryLabel} • {formatFileSize(doc.size)} • {getFileTypeLabel(doc)}
        </span>
        {doc.errors.length > 0 && (
          <span className="mt-1 block text-[11px] text-error">{doc.errors.join(" • ")}</span>
        )}
        <div className="mt-2 flex items-center gap-3">
          {previewUrl && (
            <button
              type="button"
              onClick={() => window.open(previewUrl, "_blank", "noopener,noreferrer")}
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
