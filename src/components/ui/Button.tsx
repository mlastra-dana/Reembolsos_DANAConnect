import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ink/35 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants: Record<string, string> = {
    primary:
      "bg-brand-orange text-white shadow-sm hover:bg-brand-orangeHover active:bg-brand-orangeActive",
    secondary:
      "border border-brand-border bg-brand-surface text-brand-ink hover:border-brand-ink/20 hover:bg-brand-surfaceSoft",
    ghost: "bg-transparent text-brand-muted hover:bg-brand-surfaceSoft hover:text-brand-ink"
  };

  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};
