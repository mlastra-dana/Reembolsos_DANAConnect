import React, { useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { FileDropzone } from "../components/files/FileDropzone";
import { FileItemRow } from "../components/files/FileItemRow";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { useWizard } from "../store/WizardContext";
import type { DocumentCategory, WizardDocument } from "../types";
import {
  getFileExtension,
  isAllowedFileType,
  isFileLargeEnough,
  isFileSmallEnough,
  isNameValidForCategory
} from "../utils/fileValidators";
import { validateDocumentBySlot } from "../utils/documentValidation";
import { CONFIG } from "../config";
import { CLAIM_REQUIREMENTS } from "../config/claimRequirements";

const getExpectedSlot = (category: DocumentCategory): "FACTURA" | "INFORME_RECETA" | "EVIDENCIA_ADICIONAL" => {
  if (category === "FACTURA") return "FACTURA";
  if (category === "MEDICO") return "INFORME_RECETA";
  return "EVIDENCIA_ADICIONAL";
};

const getDemoExtractedText = (file: File): string => {
  const maybeText = (file as File & {
    extractedText?: unknown;
    ocrText?: unknown;
    text?: unknown;
    content?: unknown;
  });
  if (typeof maybeText.extractedText === "string" && maybeText.extractedText.trim()) {
    return maybeText.extractedText;
  }
  if (typeof maybeText.ocrText === "string" && maybeText.ocrText.trim()) {
    return maybeText.ocrText;
  }
  if (typeof maybeText.text === "string" && maybeText.text.trim()) {
    return maybeText.text;
  }
  if (typeof maybeText.content === "string" && maybeText.content.trim()) {
    return maybeText.content;
  }
  return "";
};

export const UploadDocumentsPage: React.FC = () => {
  const {
    state: { documents, claimType },
    dispatch
  } = useWizard();
  const navigate = useNavigate();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});
  const activeClaimType = claimType ?? "GASTOS_MEDICOS";
  const requirements = CLAIM_REQUIREMENTS[activeClaimType];

  const formatKb = (bytes: number) => `${(bytes / 1024).toFixed(1)}KB`;
  const formatMb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)}MB`;

  const handleFilesAdded = (files: File[], category: DocumentCategory) => {
    const newDocs: WizardDocument[] = files.map((file) => ({
      id: uuidv4(),
      category,
      file,
      name: file.name,
      size: file.size,
      status: "EN_VALIDACION",
      errors: [],
      extractedText: getDemoExtractedText(file),
      detectedType: "INDETERMINADO",
      errorDetail: null
    }));
    dispatch({ type: "ADD_DOCUMENTS", payload: newDocs });
  };

  useEffect(() => {
    const pending = documents.filter((d) => d.status === "EN_VALIDACION");
    pending.forEach((doc) => {
      const timeout = setTimeout(() => {
        const runValidation = async () => {
          const errors: string[] = [];
          const file = doc.file as File;
          const ext = getFileExtension(doc.name) || "(sin extensión)";

          if (!doc.name.trim() || file.size === 0) {
            errors.push("Nombre vacío o archivo corrupto.");
          }
          if (!isAllowedFileType(file)) {
            errors.push(`Formato no permitido: ${ext} (solo PDF, JPG, PNG).`);
          }
          if (!isFileLargeEnough(file)) {
            errors.push(
              `Archivo muy pequeño: ${formatKb(file.size)} (mínimo ${CONFIG.fileMinSizeKb}KB).`
            );
          }
          if (!isFileSmallEnough(file)) {
            errors.push(`Archivo excede ${CONFIG.fileMaxSizeMb}MB: ${formatMb(file.size)}.`);
          }
          if (!isNameValidForCategory(doc.category, doc.name)) {
            errors.push(
              "Este archivo no cumple los requisitos. Revisa el formato o intenta con uno más nítido."
            );
          }
          const validation = await validateDocumentBySlot(
            file,
            doc.extractedText?.trim() ? doc.extractedText : getDemoExtractedText(file),
            getExpectedSlot(doc.category)
          );
          const valid = errors.length === 0 && validation.isValid;
          dispatch({
            type: "UPDATE_DOCUMENT",
            payload: {
              id: doc.id,
              patch: {
                status: valid ? "VALIDO" : "INVALIDO",
                errors,
                detectedType: validation.detectedType,
                errorDetail: validation.errorDetail
              }
            }
          });
        };

        void runValidation();
      }, 1000 + Math.random() * 1500);
      return () => clearTimeout(timeout);
    });
  }, [documents, dispatch]);

  useEffect(() => {
    setPreviewUrls((prev) => {
      const next = { ...prev };
      const ids = new Set(documents.map((d) => d.id));

      Object.entries(next).forEach(([id, url]) => {
        if (!ids.has(id)) {
          URL.revokeObjectURL(url);
          delete next[id];
        }
      });

      documents.forEach((doc) => {
        if (doc.file instanceof File && !next[doc.id]) {
          next[doc.id] = URL.createObjectURL(doc.file);
        }
      });

      return next;
    });
  }, [documents]);

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  const hasFacturaValida = documents.some(
    (d) => d.category === "FACTURA" && d.status === "VALIDO"
  );
  const hasMedicoValido = documents.some(
    (d) => d.category === "MEDICO" && d.status === "VALIDO"
  );
  const hasInvalidOrPending = documents.some(
    (d) => d.status === "INVALIDO" || d.status === "EN_VALIDACION"
  );

  const canContinue = hasFacturaValida && hasMedicoValido && !hasInvalidOrPending;

  useEffect(() => {
    if (!canContinue) {
      setInfoMessage(
        "Para continuar debes tener al menos una factura válida y un informe/receta válido, sin archivos en validación o inválidos."
      );
    } else {
      setInfoMessage(null);
    }
  }, [canContinue]);

  const grouped = useMemo(() => {
    return {
      FACTURA: documents.filter((d) => d.category === "FACTURA"),
      MEDICO: documents.filter((d) => d.category === "MEDICO"),
      EVIDENCIA: documents.filter((d) => d.category === "EVIDENCIA")
    };
  }, [documents]);

  const facturaInvalid = grouped.FACTURA.filter((d) => d.status === "INVALIDO");
  const medicoInvalid = grouped.MEDICO.filter((d) => d.status === "INVALIDO");
  const evidenceInvalid = grouped.EVIDENCIA.filter((d) => d.status === "INVALIDO");
  const getSectionErrorSummary = (invalid: WizardDocument[], section: string) =>
    invalid.length > 0
      ? `Se rechazaron ${invalid.length} archivo(s) en ${section}. Revisa el detalle en cada fila.`
      : null;
  const facturaAlertMessage = getSectionErrorSummary(facturaInvalid, "Facturas");
  const medicoAlertMessage = getSectionErrorSummary(medicoInvalid, "Informe / receta médica");
  const evidenceAlertMessage = getSectionErrorSummary(evidenceInvalid, "Evidencia adicional");

  return (
    <Card
      title={requirements.title}
      description={requirements.description}
    >
      <div className="space-y-5">
        <section className="space-y-2 rounded-xl border border-brand-border bg-brand-surfaceSoft p-4">
          <h2 className="text-sm font-semibold text-brand-ink">
            {requirements.slots.FACTURA.title} ({requirements.slots.FACTURA.required ? "obligatorio" : "opcional"})
          </h2>
          <p className="text-xs text-brand-muted">{requirements.slots.FACTURA.helperText}</p>
          {requirements.slots.FACTURA.examples.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-brand-muted">
              {requirements.slots.FACTURA.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          )}
          <FileDropzone category="FACTURA" onFilesAdded={handleFilesAdded} />
          {facturaAlertMessage && <Alert type="error" message={facturaAlertMessage} />}
          <div className="space-y-1">
            {grouped.FACTURA.map((doc) => (
              <FileItemRow
                key={doc.id}
                doc={doc}
                previewUrl={previewUrls[doc.id]}
                onRemove={() => dispatch({ type: "REMOVE_DOCUMENT", payload: { id: doc.id } })}
              />
            ))}
          </div>
        </section>

        <section className="space-y-2 rounded-xl border border-brand-border bg-brand-surfaceSoft p-4">
          <h2 className="text-sm font-semibold text-brand-ink">
            {requirements.slots.INFORME_RECETA.title} ({requirements.slots.INFORME_RECETA.required ? "obligatorio" : "opcional"})
          </h2>
          <p className="text-xs text-brand-muted">{requirements.slots.INFORME_RECETA.helperText}</p>
          {requirements.slots.INFORME_RECETA.examples.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-brand-muted">
              {requirements.slots.INFORME_RECETA.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          )}
          <FileDropzone category="MEDICO" onFilesAdded={handleFilesAdded} />
          {medicoAlertMessage && <Alert type="error" message={medicoAlertMessage} />}
          <div className="space-y-1">
            {grouped.MEDICO.map((doc) => (
              <FileItemRow
                key={doc.id}
                doc={doc}
                previewUrl={previewUrls[doc.id]}
                onRemove={() => dispatch({ type: "REMOVE_DOCUMENT", payload: { id: doc.id } })}
              />
            ))}
          </div>
        </section>

        <section className="space-y-2 rounded-xl border border-brand-border bg-brand-surfaceSoft p-4">
          <h2 className="text-sm font-semibold text-brand-ink">
            {requirements.slots.EVIDENCIA_ADICIONAL.title} ({requirements.slots.EVIDENCIA_ADICIONAL.required ? "obligatorio" : "opcional"})
          </h2>
          <p className="text-xs text-brand-muted">{requirements.slots.EVIDENCIA_ADICIONAL.helperText}</p>
          {requirements.slots.EVIDENCIA_ADICIONAL.examples.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-brand-muted">
              {requirements.slots.EVIDENCIA_ADICIONAL.examples.map((example) => (
                <li key={example}>{example}</li>
              ))}
            </ul>
          )}
          <FileDropzone category="EVIDENCIA" onFilesAdded={handleFilesAdded} />
          {evidenceAlertMessage && <Alert type="error" message={evidenceAlertMessage} />}
          <div className="space-y-1">
            {grouped.EVIDENCIA.map((doc) => (
              <FileItemRow
                key={doc.id}
                doc={doc}
                previewUrl={previewUrls[doc.id]}
                onRemove={() => dispatch({ type: "REMOVE_DOCUMENT", payload: { id: doc.id } })}
              />
            ))}
          </div>
        </section>

        {infoMessage && <Alert type="info" message={infoMessage} />}

        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate("/wizard/siniestro")}>
            Atrás
          </Button>
          <Button
            type="button"
            disabled={!canContinue}
            onClick={() => navigate("/wizard/resumen")}
          >
            Continuar
          </Button>
        </div>
      </div>
    </Card>
  );
};
