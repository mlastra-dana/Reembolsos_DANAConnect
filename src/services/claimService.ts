import type { WizardDocument, WizardState } from "../types";
import { generatePreRegistrationNumber } from "../utils/preRegistration";

interface CreatePreRegistrationPayload {
  session: WizardState["session"];
  insured: WizardState["selectedInsured"];
  claimType: WizardState["claimType"];
  documents: WizardDocument[];
}

interface CreatePreRegistrationResult {
  preRegistrationNumber: string;
}

export class ApiError extends Error {}

export async function createPreRegistration(
  payload: CreatePreRegistrationPayload
): Promise<CreatePreRegistrationResult> {
  // Simula latencia y posibles errores/timeout
  const delay = 1200 + Math.random() * 1000;

  await new Promise((resolve) => setTimeout(resolve, delay));

  const randomFail = Math.random();
  if (randomFail < 0.1) {
    throw new ApiError("Ocurrió un error al registrar el preregistro. Intenta nuevamente.");
  }

  const preRegistrationNumber = generatePreRegistrationNumber();

  // Aquí se podría enviar `payload` a una API real usando fetch/axios
  return { preRegistrationNumber };
}

