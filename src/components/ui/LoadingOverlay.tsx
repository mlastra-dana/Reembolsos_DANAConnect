import React from "react";

export const LoadingOverlay: React.FC<{ message?: string }> = ({ message }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-brand-ink/20">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-brand-border bg-brand-surface px-4 py-3 shadow-card">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-ink border-t-transparent" />
        <span className="text-sm text-brand-ink">
          {message ?? "Procesando, por favor espera..."}
        </span>
      </div>
    </div>
  );
};

