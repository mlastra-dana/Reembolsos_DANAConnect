import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../../store/WizardContext";

export const Header: React.FC = () => {
  const { session, clear } = useSession();
  const location = useLocation();
  const navigate = useNavigate();

  const showLogout = !!session && location.pathname !== "/auth";

  const handleLogout = () => {
    clear();
    navigate("/auth");
  };

  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="text-lg font-bold">PS</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary">Pacífico Salud</span>
            <span className="text-xs text-slate-500">Portal de preregistro de reembolsos</span>
          </div>
        </div>
        {showLogout && (
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Cerrar sesión
          </button>
        )}
      </div>
    </header>
  );
};

