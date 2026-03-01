import React from "react";
import type { WizardDocument } from "../../types";

interface FileItemRowProps {
  doc: WizardDocument;
  onRemove: () => void;
}

export const FileItemRow: React.FC<FileItemRowProps> = ({ doc, onRemove }) => {
  const statusLabel =
    doc.status === "EN_VALIDACION"
      ? "En validación"
      : doc.status === "VALIDO"
      ? "Válido"
      : "Inválido";
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

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-border bg-brand-surface px-3 py-2 text-xs">
      <div className="flex flex-1 flex-col">
        <span className="truncate font-medium text-brand-ink">{doc.name}</span>
        <span className="text-[11px] text-brand-muted">
          {categoryLabel} • {(doc.size / 1024).toFixed(1)} KB
        </span>
        {doc.errors.length > 0 && (
          <span className="mt-1 text-[11px] text-error">
            {doc.errors.join(" • ")}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor}`}>
          {statusLabel}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-[11px] text-brand-muted hover:text-error"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
};

