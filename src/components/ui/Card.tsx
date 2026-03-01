import React from "react";

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, description, children }) => {
  return (
    <section className="w-full rounded-xl bg-white p-4 shadow-card sm:p-6">
      {(title || description) && (
        <header className="mb-4">
          {title && <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">{title}</h1>}
          {description && (
            <p className="mt-1 text-sm text-slate-600 sm:text-base">{description}</p>
          )}
        </header>
      )}
      {children}
    </section>
  );
};

