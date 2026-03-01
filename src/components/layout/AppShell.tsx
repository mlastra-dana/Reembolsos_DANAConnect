import React from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Stepper } from "../Stepper";
import { Alert } from "../ui/Alert";

interface AppShellProps {
  children: React.ReactNode;
  showStepper?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({ children, showStepper = true }) => {
  const location = useLocation();
  const reason = (location.state as { reason?: string } | null)?.reason;

  return (
    <div className="app-container">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {showStepper && <Stepper />}
        {showStepper && reason === "expired" && (
          <div className="mb-5">
            <Alert type="warning" message="Tu sesión expiró. Por favor, inicia nuevamente." />
          </div>
        )}
        <div className="flex-1">{children}</div>
      </main>
      <footer className="border-t border-brand-border bg-brand-surface/90">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-brand-muted sm:px-6 lg:px-8">
          © {new Date().getFullYear()} DANAconnect. Portal de preregistro de reembolsos.
        </div>
      </footer>
    </div>
  );
};
