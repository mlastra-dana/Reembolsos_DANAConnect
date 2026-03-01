import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const steps = [
  { path: "/wizard/auth", label: "Autenticación", step: 1 },
  { path: "/wizard/asegurado", label: "Asegurado", step: 2 },
  { path: "/wizard/siniestro", label: "Tipo de siniestro", step: 3 },
  { path: "/wizard/documentos", label: "Documentos", step: 4 },
  { path: "/wizard/resumen", label: "Revisión y envío", step: 5 },
  { path: "/wizard/confirmacion", label: "Confirmación", step: 6 }
];

export const Stepper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = steps.findIndex((s) => location.pathname.startsWith(s.path));
  const visibleIndex = currentIndex >= 0 ? currentIndex : 0;

  return (
    <nav aria-label="Progreso" className="mb-6">
      <ol className="hidden items-center gap-2 rounded-full border border-brand-border bg-brand-surface px-4 py-3 shadow-sm sm:flex">
        {steps.map((step, index) => {
          const active = index === visibleIndex;
          const completed = index < visibleIndex;
          return (
            <li key={step.path} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => {
                  if (completed || active) navigate(step.path);
                }}
                className="group flex w-full items-center gap-2 text-left text-xs font-medium text-brand-muted transition"
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                    active
                      ? "bg-brand-orange text-white"
                      : completed
                      ? "bg-brand-orange text-white"
                      : "border border-brand-border bg-brand-background text-brand-muted"
                  }`}
                >
                  {step.step}
                </span>
                <span className={active ? "font-semibold text-brand-ink" : "text-brand-muted"}>
                  {step.label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span className="mx-2 h-px flex-1 bg-brand-border" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-border bg-brand-surface p-3 text-xs text-brand-muted sm:hidden">
        <span>
          Paso {visibleIndex + 1} de {steps.length}
        </span>
        <span className="font-semibold text-brand-ink">{steps[visibleIndex]?.label}</span>
      </div>
    </nav>
  );
};
