import React, { forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, ...props }, ref) => {
    const inputId = id ?? props.name ?? label;
    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-brand-ink">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={clsx(
            "w-full rounded-xl border bg-brand-surface px-3 py-2.5 text-sm text-brand-ink shadow-sm transition placeholder:text-brand-muted/80 focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange",
            error ? "border-error" : "border-brand-border hover:border-brand-ink/20"
          )}
          {...props}
        />
        {helperText && !error && <p className="text-xs text-brand-muted">{helperText}</p>}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
