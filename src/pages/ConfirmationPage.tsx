import React from "react";
import { Card } from "../components/ui/Card";
import { useWizard } from "../store/WizardContext";

export const ConfirmationPage: React.FC = () => {
  const {
    state: { preRegistrationNumber, documents, claimType }
  } = useWizard();
  const now = new Date();
  const formattedDate = now.toLocaleString("es-VE", {
    dateStyle: "short",
    timeStyle: "short"
  });
  const claimTypeLabel =
    claimType === "GASTOS_MEDICOS"
      ? "Gastos médicos"
      : claimType === "EMERGENCIA"
      ? "Emergencia"
      : claimType === "CONSULTA"
      ? "Consulta"
      : "No especificado";
  const totalDocuments = documents.length;

  return (
    <Card
      title="Preregistro recibido"
      description="Tu preregistro de reembolso fue recibido y está en revisión."
    >
      <div className="space-y-4 text-sm text-brand-ink">
        <section className="rounded-2xl border border-brand-border bg-brand-surfaceSoft p-5">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange/10 text-xl text-brand-orange">
              ✓
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-brand-ink">Preregistro recibido</h2>
              <p className="text-brand-muted">
                Tu documentación fue recibida y está en revisión.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border bg-brand-surfaceSoft p-5">
          <h3 className="mb-3 text-lg font-semibold text-brand-ink">Resumen</h3>
          <div className="space-y-2 text-base">
            <p><span className="font-medium">Portal:</span> DANAconnect</p>
            <p><span className="font-medium">Tipo de siniestro:</span> {claimTypeLabel}</p>
            <p><span className="font-medium">Documentos recibidos:</span> {totalDocuments}</p>
            <p><span className="font-medium">Fecha:</span> {formattedDate}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-orange/40 bg-brand-orange/5 p-5">
          <p className="text-xs uppercase tracking-wide text-brand-muted">Código de solicitud</p>
          <p className="mt-2 text-4xl font-semibold tracking-wide text-brand-orange">
            {preRegistrationNumber ?? "—"}
          </p>
          <p className="mt-2 text-xs text-brand-muted">
            Conserva este código para seguimiento del preregistro.
          </p>
        </section>
      </div>
    </Card>
  );
};
