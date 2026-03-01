import React from "react";
import clsx from "clsx";

interface RadioCardOption {
  label: string;
  value: string;
  description?: string;
}

interface RadioCardGroupProps {
  name: string;
  value: string | null;
  onChange: (value: string) => void;
  options: RadioCardOption[];
  error?: string;
}

export const RadioCardGroup: React.FC<RadioCardGroupProps> = ({
  name,
  value,
  onChange,
  options,
  error
}) => {
  return (
    <div className="space-y-2.5">
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(opt.value)}
              className={clsx(
                "flex h-full flex-col items-start rounded-xl border p-4 text-left text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-brand-ink/25",
                selected
                  ? "border-brand-ink bg-brand-ink/5"
                  : "border-brand-border bg-brand-surface hover:border-brand-ink/25 hover:bg-brand-surfaceSoft"
              )}
            >
              <span className="font-medium text-brand-ink">{opt.label}</span>
              {opt.description && (
                <span className="mt-1 text-xs text-brand-muted">{opt.description}</span>
              )}
            </button>
          );
        })}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
};
