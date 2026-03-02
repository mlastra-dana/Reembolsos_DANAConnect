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
  isAllowedFileType,
  isFileLargeEnough,
  isFileSmallEnough,
  isNameValidForCategory
} from "../utils/fileValidators";
import { CONFIG } from "../config";

export const UploadDocumentsPage: React.FC = () => {
  const {
    state: { documents },
    dispatch
  } = useWizard();
  const navigate = useNavigate();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef<Record<string, string>>({});

  const handleFilesAdded = (files: File[], category: DocumentCategory) => {
    const newDocs: WizardDocument[] = files.map((file) => ({
      id: uuidv4(),
      category,
      file,
      name: file.name,
      size: file.size,
      status: "EN_VALIDACION",
      errors: []
    }));
    dispatch({ type: "ADD_DOCUMENTS", payload: newDocs });
  };

  useEffect(() => {
    const pending = documents.filter((d) => d.status === "EN_VALIDACION");
    pending.forEach((doc) => {
      const timeout = setTimeout(() => {
        const errors: string[] = [];
        if (!isAllowedFileType(doc.file as File)) {
          errors.push("Formato no permitido.");
        }
        if (!isFileLargeEnough(doc.file as File)) {
          errors.push("Este archivo no cumple el tamaño mínimo requerido.");
        }
        if (!isFileSmallEnough(doc.file as File)) {
          errors.push(`El archivo supera el tamaño máximo permitido (${CONFIG.fileMaxSizeMb} MB).`);
        }
        if (!isNameValidForCategory(doc.category, doc.name)) {
          errors.push(
            "Este archivo no cumple los requisitos. Revisa el formato o intenta con uno más nítido."
          );
        }
        const valid = errors.length === 0;
        dispatch({
          type: "UPDATE_DOCUMENT",
          payload: {
            id: doc.id,
            patch: {
              status: valid ? "VALIDO" : "INVALIDO",
              errors
            }
          }
        });
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

  const evidenceInvalid = grouped.EVIDENCIA.filter((d) => d.status === "INVALIDO");
  const evidenceAlertMessage =
    evidenceInvalid.length > 0
      ? evidenceInvalid[0].errors[0] ??
        "Se detectaron archivos inválidos en Evidencia adicional. Verifica formato y tamaño."
      : null;

  return (
    <Card
      title="Carga de documentos"
      description="Adjunta las facturas y documentos médicos necesarios para tu preregistro."
    >
      <div className="space-y-5">
        <section className="space-y-2 rounded-xl border border-brand-border bg-brand-surfaceSoft p-4">
          <h2 className="text-sm font-semibold text-brand-ink">Facturas (obligatorio)</h2>
          <FileDropzone category="FACTURA" onFilesAdded={handleFilesAdded} />
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
            Informe / receta médica (obligatorio)
          </h2>
          <FileDropzone category="MEDICO" onFilesAdded={handleFilesAdded} />
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
            Evidencia adicional (opcional)
          </h2>
          <p className="text-xs text-brand-muted">
            Puedes agregar evidencia adicional como: ecografías, radiografías, exámenes de
            laboratorio, informes médicos y cualquier soporte relacionado con el reembolso.
          </p>
          <FileDropzone category="EVIDENCIA" onFilesAdded={handleFilesAdded} />
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
          {evidenceAlertMessage && <Alert type="error" message={evidenceAlertMessage} />}
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
