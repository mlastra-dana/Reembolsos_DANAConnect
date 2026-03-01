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
    navigate("/siniestro");
  };

  return (
    <Card
      title="Selecciona al asegurado"
      description="Elige a la persona para la cual registrarás el reembolso."
    >
      {isLoading && <p className="text-sm text-slate-600">Cargando asegurados...</p>}
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
        <div className="space-y-4">
          <ul className="space-y-2">
            {data.map((insured) => {
              const isSelected = selectedInsured?.id === insured.id;
              return (
                <li key={insured.id}>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "SET_INSURED", payload: insured })}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-primary/60"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {insured.maskedName} ({insured.relation})
                      </div>
                      <div className="text-xs text-slate-600">
                        Rango de edad: {insured.ageRange}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end">
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

