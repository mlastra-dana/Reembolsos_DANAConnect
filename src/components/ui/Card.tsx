import React from "react";

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, description, children, className }) => {
  return (
    <section className={`w-full rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-card sm:p-7 ${className ?? ""}`}>
      {(title || description) && (
        <header className="mb-6 space-y-2">
          {title && <h1 className="text-2xl font-semibold tracking-tight text-brand-ink sm:text-3xl">{title}</h1>}
          {description && (
            <p className="max-w-2xl text-sm text-brand-muted sm:text-base">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
};
