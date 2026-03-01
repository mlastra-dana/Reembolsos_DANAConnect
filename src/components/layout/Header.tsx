import React from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../store/WizardContext";
import { Button } from "../ui/Button";
import logoDanaConnect from "../../assets/logo-danaconnect-horizontal.png";

export const Header: React.FC = () => {
  const { clear } = useSession();
  const navigate = useNavigate();

  const handleLogout = () => {
    clear();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-brand-border bg-brand-surface/95 shadow-header backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src={logoDanaConnect}
            alt="DANAconnect"
            className="h-9 w-auto object-contain sm:h-10 lg:h-11"
          />
          <div className="flex flex-col">
            <span className="text-xs text-brand-muted">Portal de preregistro de reembolsos</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <a href="#contacto" className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline">
            Ayuda
          </a>
          <Button type="button" onClick={handleLogout} className="px-4 py-2 text-xs uppercase tracking-wide">
            SALIR
          </Button>
        </div>
      </div>
    </header>
  );
};
