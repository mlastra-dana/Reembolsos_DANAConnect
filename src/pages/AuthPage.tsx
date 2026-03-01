import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { CaptchaMock } from "../components/CaptchaMock";
import { login, LockoutError } from "../services/authService";
import { useWizard } from "../store/WizardContext";
import { Alert } from "../components/ui/Alert";

const schema = z.object({
  policyNumber: z.string().min(1, "Ingresa tu número de póliza."),
  dob: z.string().min(1, "Ingresa tu fecha de nacimiento."),
  captcha: z.literal(true, {
    errorMap: () => ({ message: "Debes confirmar que no eres un robot." })
  })
});

type FormValues = z.infer<typeof schema>;

export const AuthPage: React.FC = () => {
  const { dispatch } = useWizard();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [lockoutMessage, setLockoutMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      policyNumber: "",
      dob: "",
      captcha: false
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) => login(data.policyNumber, data.dob),
    onSuccess: ({ session }) => {
      dispatch({ type: "SET_SESSION", payload: session });
      setServerError(null);
      setLockoutMessage(null);
      navigate("/wizard/asegurado");
    },
    onError: (error: unknown) => {
      if (error instanceof LockoutError) {
        const remainingMinutes = Math.ceil(error.remainingMs / (60 * 1000));
        setLockoutMessage(
          `Has excedido el número de intentos. Por seguridad, el acceso está bloqueado por 24 horas. Tiempo restante estimado: ${remainingMinutes} minutos.`
        );
        setServerError(null);
      } else if (error instanceof Error) {
        setServerError(error.message);
        setLockoutMessage(null);
      } else {
        setServerError("Ocurrió un error inesperado. Intenta nuevamente.");
      }
    }
  });

  const onSubmit = (data: FormValues) => {
    setServerError(null);
    setLockoutMessage(null);
    mutate(data);
  };

  return (
    <Card
      title="Autenticación"
      description="Ingresa los datos de tu póliza para iniciar el preregistro de reembolso."
    >
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Número de póliza"
          placeholder="Ej. POL123456"
          autoComplete="off"
          {...register("policyNumber")}
          error={errors.policyNumber?.message}
        />
        <Input
          label="Fecha de nacimiento"
          type="date"
          {...register("dob")}
          error={errors.dob?.message}
        />
        <div>
          <CaptchaMock
            checked={!!watch("captcha")}
            onChange={(value) => setValue("captcha", value, { shouldValidate: true })}
          />
          {errors.captcha && (
            <p className="mt-1 text-xs text-error">{errors.captcha.message}</p>
          )}
        </div>
        {serverError && <Alert type="error" message={serverError} />}
        {lockoutMessage && <Alert type="warning" message={lockoutMessage} />}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Verificando..." : "Continuar"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
