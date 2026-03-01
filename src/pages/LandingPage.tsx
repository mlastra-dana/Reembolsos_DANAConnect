import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-2xl bg-brand-orange px-6 py-10 text-white shadow-card sm:px-10 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Portal de preregistro de reembolsos
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
          Demo DANAconnect para iniciar tu preregistro de forma guiada, simple y segura.
        </p>
      </section>

      <Card
        title="Demo DANAconnect - Portal de preregistro de reembolsos"
        description="Completa el flujo en tres pasos y envía tu solicitud."
      >
        <ul className="grid gap-3 text-sm text-brand-ink sm:grid-cols-3">
          <li className="rounded-xl border border-brand-border bg-brand-surfaceSoft px-4 py-3">
            Autentica tu póliza
          </li>
          <li className="rounded-xl border border-brand-border bg-brand-surfaceSoft px-4 py-3">
            Carga documentos
          </li>
          <li className="rounded-xl border border-brand-border bg-brand-surfaceSoft px-4 py-3">
            Revisa y envía
          </li>
        </ul>
        <div className="mt-6 flex justify-end">
          <Button type="button" onClick={() => navigate("/wizard/auth")}>
            ENTRAR A DEMO
          </Button>
        </div>
      </Card>
    </div>
  );
};
