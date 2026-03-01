import React from "react";

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-slate-900/10">
      <div className="pointer-events-auto flex items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-card">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-slate-700">
          {message ?? "Procesando, por favor espera..."}
        </span>
      </div>
    </div>
  );
};

