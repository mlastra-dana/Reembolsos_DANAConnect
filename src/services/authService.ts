import { canAttempt, clearLockout, registerFailedAttempt } from "../utils/lockout";
import type { Session, Insured } from "../types";
import { ageToRange, maskName } from "../utils/masking";

interface LoginResult {
  session: Session;
}

const MOCK_USER = {
  policyNumber: "POL123456",
  dob: "1990-05-20"
};

const MOCK_SINGLE_POLICY = {
  policyNumber: "POL654321",
  dob: "1985-03-10"
};

export class LockoutError extends Error {
  remainingMs: number;
  constructor(remainingMs: number) {
    super("LOCKED");
    this.remainingMs = remainingMs;
  }
}

export async function login(
  policyNumber: string,
  dob: string,
  _captchaToken?: string
): Promise<LoginResult> {
  const attempt = canAttempt(policyNumber);
  if (!attempt.allowed) {
    throw new LockoutError(attempt.remainingMs);
  }

  await new Promise((resolve) => setTimeout(resolve, 700));

  const isValidMock =
    (policyNumber === MOCK_USER.policyNumber && dob === MOCK_USER.dob) ||
    (policyNumber === MOCK_SINGLE_POLICY.policyNumber && dob === MOCK_SINGLE_POLICY.dob);

  if (!isValidMock) {
    const info = registerFailedAttempt(policyNumber);
    if (info.lockedUntil && info.lockedUntil > Date.now()) {
      throw new LockoutError(info.lockedUntil - Date.now());
    }
    throw new Error(
      "Los datos ingresados no coinciden. Verifica tu número de póliza y fecha de nacimiento."
    );
  }

  clearLockout(policyNumber);

  const session: Session = {
    token: `mock-${policyNumber}-${Date.now()}`,
    policyNumber,
    dob,
    createdAt: Date.now()
  };

  return { session };
}

export async function getInsuredList(sessionToken: string): Promise<Insured[]> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  const [, policyNumber] = sessionToken.split("-");

  if (policyNumber === MOCK_USER.policyNumber) {
    const insured: Insured[] = [
      {
        id: "1",
        fullName: "Camila Delgado",
        maskedName: maskName("Camila Delgado"),
        relation: "Titular",
        age: 35,
        ageRange: ageToRange(35)
      },
      {
        id: "2",
        fullName: "Diego Delgado",
        maskedName: maskName("Diego Delgado"),
        relation: "Hijo",
        age: 12,
        ageRange: ageToRange(12)
      }
    ];
    return insured;
  }

  if (policyNumber === MOCK_SINGLE_POLICY.policyNumber) {
    const insured: Insured[] = [
      {
        id: "3",
        fullName: "Luis Pérez",
        maskedName: maskName("Luis Pérez"),
        relation: "Titular",
        age: 40,
        ageRange: ageToRange(40)
      }
    ];
    return insured;
  }

  return [];
}

