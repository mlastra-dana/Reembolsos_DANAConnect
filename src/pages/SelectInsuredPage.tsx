import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";
import { useWizard } from "../store/WizardContext";
import { getInsuredList } from "../services/authService";

export const SelectInsuredPage: React.FC = () => {
  const {
    state: { session, selectedInsured },
    dispatch
  } = useWizard();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["insured", session?.token],
    queryFn: () => getInsuredList(session!.token),
    enabled: !!session?.token
  });

  React.useEffect(() => {
    if (data && data.length === 1 && !selectedInsured) {
      dispatch({ type: "SET_INSURED", payload: data[0] });
    }
  }, [data, selectedInsured, dispatch]);

  const handleContinue = () => {
    if (!selectedInsured && data && data.length === 1) {
      dispatch({ type: "SET_INSURED", payload: data[0] });
    }
    navigate("/wizard/siniestro");
  };

  return (
    <Card
      title="Selecciona al asegurado"
      description="Elige a la persona para la cual registrarás el reembolso."
    >
      {isLoading && <p className="text-sm text-brand-muted">Cargando asegurados...</p>}
      {isError && (
        <div className="space-y-3">
          <Alert
            type="error"
            message="No pudimos obtener la lista de asegurados. Intenta nuevamente."
          />
          <Button variant="secondary" type="button" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      )}
      {data && (
        <div className="space-y-5">
          <ul className="space-y-2">
            {data.map((insured) => {
              const isSelected = selectedInsured?.id === insured.id;
              return (
                <li key={insured.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "SET_INSURED", payload: insured })}
                    className={`flex w-full items-center justify-between rounded-xl border bg-brand-surface px-4 py-3 text-left text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-ink/25 ${
                      isSelected
                        ? "border-brand-ink bg-brand-ink/5"
                        : "border-brand-border hover:border-brand-ink/30"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-brand-ink">
                        {insured.maskedName} ({insured.relation})
                      </div>
                      <div className="text-xs text-brand-muted">
                        Rango de edad: {insured.ageRange}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate("/wizard/auth")}>
              Atrás
            </Button>
            <Button
              type="button"
              disabled={!selectedInsured && data.length > 1}
              onClick={handleContinue}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
