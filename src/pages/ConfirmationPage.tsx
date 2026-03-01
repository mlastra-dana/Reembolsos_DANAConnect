import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useWizard } from "../store/WizardContext";

export const ConfirmationPage: React.FC = () => {
  const {
    state: { preRegistrationNumber },
    dispatch
  } = useWizard();
  const navigate = useNavigate();

  const handleNew = () => {
    dispatch({ type: "RESET" });
    navigate("/wizard/auth");
  };

  return (
    <Card
      title="Preregistro enviado"
      description="Hemos recibido tu preregistro de reembolso."
    >
      <div className="space-y-5 text-sm text-brand-ink">
        <p>
          Tu número de preregistro es:{" "}
          <span className="font-semibold text-brand-ink">
            {preRegistrationNumber ?? "—"}
          </span>
        </p>
        <p>Se ha enviado una confirmación por correo electrónico.</p>
        <p className="rounded-xl border border-brand-border bg-brand-surfaceSoft p-3 text-xs text-brand-muted">
          Conserva este número para hacer seguimiento de tu solicitud o para futuras consultas.
        </p>
        <div className="flex justify-end">
          <Button type="button" onClick={handleNew}>
            Iniciar nuevo registro
          </Button>
        </div>
      </div>
    </Card>
  );
};
