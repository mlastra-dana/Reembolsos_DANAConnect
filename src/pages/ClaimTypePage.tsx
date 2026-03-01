import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { RadioCardGroup } from "../components/ui/RadioCard";
import { useWizard } from "../store/WizardContext";

const schema = z.object({
  claimType: z.enum(["GASTOS_MEDICOS", "EMERGENCIA", "CONSULTA"], {
    required_error: "Selecciona un tipo de siniestro."
  })
});

type FormValues = z.infer<typeof schema>;

export const ClaimTypePage: React.FC = () => {
  const {
    state: { claimType },
    dispatch
  } = useWizard();
  const navigate = useNavigate();

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { claimType: claimType ?? undefined }
  });

  const selected = watch("claimType") ?? claimType ?? null;

  const onSubmit = (data: FormValues) => {
    dispatch({ type: "SET_CLAIM_TYPE", payload: data.claimType });
    navigate("/wizard/documentos");
  };

  return (
    <Card
      title="Tipo de siniestro"
      description="Indica qué tipo de gastos deseas preregistrar."
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <RadioCardGroup
          name="claimType"
          value={selected}
          onChange={(val) => setValue("claimType", val as FormValues["claimType"], { shouldValidate: true })}
          options={[
            { value: "GASTOS_MEDICOS", label: "Gastos médicos", description: "Consultas, exámenes y procedimientos." },
            { value: "EMERGENCIA", label: "Emergencia", description: "Atenciones de urgencia o emergencia." },
            { value: "CONSULTA", label: "Consulta", description: "Consultas ambulatorias sin emergencia." }
          ]}
          error={errors.claimType?.message}
        />
        <div className="flex items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate("/wizard/asegurado")}>
            Atrás
          </Button>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </Card>
  );
};
