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
    navigate("/auth");
  };

  return (
    <Card
      title="Preregistro enviado"
      description="Hemos recibido tu preregistro de reembolso."
    >
      <div className="space-y-4 text-sm text-slate-800">
        <p>
          Tu número de preregistro es:{" "}
          <span className="font-semibold text-primary">
            {preRegistrationNumber ?? "—"}
          </span>
        </p>
        <p>Se ha enviado una confirmación por correo electrónico.</p>
        <p className="text-xs text-slate-600">
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

