import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
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
  isNameValidForCategory
} from "../utils/fileValidators";

export const UploadDocumentsPage: React.FC = () => {
  const {
    state: { documents },
    dispatch
  } = useWizard();
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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

  return (
    <Card
      title="Carga de documentos"
      description="Adjunta las facturas y documentos médicos necesarios para tu preregistro."
    >
      <div className="space-y-5">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">Facturas (obligatorio)</h2>
          <FileDropzone category="FACTURA" onFilesAdded={handleFilesAdded} />
          <div className="space-y-1">
            {grouped.FACTURA.map((doc) => (
              <FileItemRow
                key={doc.id}
                doc={doc}
                onRemove={() => dispatch({ type: "REMOVE_DOCUMENT", payload: { id: doc.id } })}
              />
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Informe / receta médica (obligatorio)
          </h2>
          <FileDropzone category="MEDICO" onFilesAdded={handleFilesAdded} />
          <div className="space-y-1">
            {grouped.MEDICO.map((doc) => (
              <FileItemRow
                key={doc.id}
                doc={doc}
                onRemove={() => dispatch({ type: "REMOVE_DOCUMENT", payload: { id: doc.id } })}
              />
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">
            Evidencia adicional (opcional)
          </h2>
          <FileDropzone category="EVIDENCIA" onFilesAdded={handleFilesAdded} />
          <div className="space-y-1">
            {grouped.EVIDENCIA.map((doc) => (
              <FileItemRow
                key={doc.id}
                doc={doc}
                onRemove={() => dispatch({ type: "REMOVE_DOCUMENT", payload: { id: doc.id } })}
              />
            ))}
          </div>
        </section>

        {infoMessage && <Alert type="info" message={infoMessage} />}

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!canContinue}
            onClick={() => (window.location.href = "/resumen")}
          >
            Continuar
          </Button>
        </div>
      </div>
    </Card>
  );
};

