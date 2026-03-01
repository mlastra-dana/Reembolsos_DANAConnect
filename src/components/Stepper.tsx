import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const steps = [
  { path: "/auth", label: "Autenticación", step: 1 },
  { path: "/asegurado", label: "Asegurado", step: 2 },
  { path: "/siniestro", label: "Tipo de siniestro", step: 3 },
  { path: "/documentos", label: "Documentos", step: 4 },
  { path: "/resumen", label: "Revisión y envío", step: 5 },
  { path: "/confirmacion", label: "Confirmación", step: 6 }
];

export const Stepper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = steps.findIndex((s) => location.pathname.startsWith(s.path));

  return (
    <nav aria-label="Progreso" className="mb-4">
      <ol className="hidden gap-3 sm:flex">
        {steps.map((step, index) => {
          const active = index === currentIndex;
          const completed = index < currentIndex;
          return (
            <li key={step.path} className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (completed || active) navigate(step.path);
                }}
                className="flex w-full items-center gap-2 text-left text-xs font-medium text-slate-600"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    active
                      ? "bg-primary text-white"
                      : completed
                      ? "bg-success/90 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {step.step}
                </span>
                <span className={active ? "text-primary" : ""}>{step.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between gap-2 text-xs text-slate-600 sm:hidden">
        <span>
          Paso {currentIndex + 1} de {steps.length}
        </span>
        <span className="font-medium text-primary">{steps[currentIndex]?.label}</span>
      </div>
    </nav>
  );
};

