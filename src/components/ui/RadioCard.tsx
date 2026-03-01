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
    <div className="space-y-2">
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
                "flex h-full flex-col items-start rounded-lg border p-3 text-left text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-slate-200 hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <span className="font-medium text-slate-900">{opt.label}</span>
              {opt.description && (
                <span className="mt-1 text-xs text-slate-600">{opt.description}</span>
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

