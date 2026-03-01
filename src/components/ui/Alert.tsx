import React from "react";
import clsx from "clsx";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type = "info", title, message }) => {
  const base =
    "flex gap-2 rounded-lg border px-3 py-2 text-sm items-start bg-white/80 backdrop-blur";
  const variants: Record<string, string> = {
    info: "border-accent/40 text-slate-800",
    success: "border-success/40 text-success",
    warning: "border-warning/40 text-warning",
    error: "border-error/40 text-error"
  };

  return (
    <div className={clsx(base, variants[type])} role="alert">
      <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-current" />
      <div>
        {title && <div className="text-xs font-semibold uppercase">{title}</div>}
        <div>{message}</div>
      </div>
    </div>
  );
};

