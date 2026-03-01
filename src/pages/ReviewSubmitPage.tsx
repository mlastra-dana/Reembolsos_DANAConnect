import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { useWizard } from "../store/WizardContext";
import { createPreRegistration } from "../services/claimService";
import { LoadingOverlay } from "../components/ui/LoadingOverlay";

export const ReviewSubmitPage: React.FC = () => {
  const {
    state: { session, selectedInsured, claimType, documents },
    dispatch
  } = useWizard();
  const navigate = useNavigate();

  const invalidOrPending = documents.filter(
    (d) => d.status === "INVALIDO" || d.status === "EN_VALIDACION"
  );
  const hasFacturaValida = documents.some(
    (d) => d.category === "FACTURA" && d.status === "VALIDO"
  );
  const hasMedicoValido = documents.some(
    (d) => d.category === "MEDICO" && d.status === "VALIDO"
  );

  const disabledReason = (() => {
    if (!claimType) return "Debes seleccionar un tipo de siniestro.";
    if (!hasFacturaValida || !hasMedicoValido)
      return "Necesitas al menos una factura válida y un informe/receta válido.";
    if (invalidOrPending.length > 0)
      return "No puedes continuar mientras existan archivos inválidos o en validación.";
    return null;
  })();

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => createPreRegistration({ session, insured: selectedInsured, claimType, documents }),
    onSuccess: (result) => {
      dispatch({ type: "SET_PRE_REG", payload: result.preRegistrationNumber });
      navigate("/confirmacion");
    }
  });

  const handleSubmit = () => {
    if (disabledReason) return;
    mutate();
  };

  const summaryDocs = {
    FACTURA: documents.filter((d) => d.category === "FACTURA"),
    MEDICO: documents.filter((d) => d.category === "MEDICO"),
    EVIDENCIA: documents.filter((d) => d.category === "EVIDENCIA")
  };

  return (
    <>
      {isPending && <LoadingOverlay message="Enviando preregistro..." />}
      <Card
        title="Revisión y envío"
        description="Verifica que la información sea correcta antes de enviar el preregistro."
      >
        <div className="space-y-4 text-sm">
          <section>
            <h2 className="mb-1 text-xs font-semibold uppercase text-slate-500">
              Asegurado
            </h2>
            <p className="text-slate-800">
              {selectedInsured
                ? `${selectedInsured.maskedName} (${selectedInsured.relation})`
                : "No disponible"}
            </p>
          </section>

          <section>
            <h2 className="mb-1 text-xs font-semibold uppercase text-slate-500">
              Tipo de siniestro
            </h2>
            <p className="text-slate-800">
              {claimType === "GASTOS_MEDICOS"
                ? "Gastos médicos"
                : claimType === "EMERGENCIA"
                ? "Emergencia"
                : claimType === "CONSULTA"
                ? "Consulta"
                : "No seleccionado"}
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase text-slate-500">
              Documentos adjuntos
            </h2>
            <p className="text-xs text-slate-600">
              Facturas: {summaryDocs.FACTURA.length} • Informe/receta:{" "}
              {summaryDocs.MEDICO.length} • Evidencia adicional:{" "}
              {summaryDocs.EVIDENCIA.length}
            </p>
            <ul className="space-y-1">
              {documents.map((doc) => (
                <li key={doc.id} className="text-xs text-slate-700">
                  - {doc.name} ({doc.category}) –{" "}
                  {doc.status === "VALIDO"
                    ? "Válido"
                    : doc.status === "EN_VALIDACION"
                    ? "En validación"
                    : "Inválido"}
                </li>
              ))}
            </ul>
          </section>

          {disabledReason && (
            <Alert type="info" message={disabledReason} />
          )}
          {error instanceof Error && (
            <Alert type="error" message={error.message} />
          )}

          <div className="flex justify-end">
            <Button type="button" disabled={!!disabledReason || isPending} onClick={handleSubmit}>
              Enviar preregistro
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};

