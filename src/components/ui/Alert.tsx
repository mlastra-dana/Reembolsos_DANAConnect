import React from "react";
import clsx from "clsx";

interface AlertProps {
  type?: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
}

export const Alert: React.FC<AlertProps> = ({ type = "info", title, message }) => {
  const base =
    "flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm";
  const variants: Record<string, string> = {
    info: "border-brand-border bg-brand-surfaceSoft text-brand-ink",
    success: "border-semantic-success/25 bg-semantic-success/5 text-semantic-success",
    warning: "border-semantic-warning/25 bg-semantic-warning/5 text-semantic-warning",
    error: "border-semantic-error/25 bg-semantic-error/5 text-semantic-error"
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
