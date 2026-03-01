export type DocumentCategory = "FACTURA" | "MEDICO" | "EVIDENCIA";

export type DocumentStatus = "EN_VALIDACION" | "VALIDO" | "INVALIDO";

export interface Session {
  token: string;
  policyNumber: string;
  dob: string;
  createdAt: number;
}

export interface Insured {
  id: string;
  fullName: string;
  maskedName: string;
  relation: string;
  age: number;
  ageRange: string;
}

export interface WizardDocument {
  id: string;
  category: DocumentCategory;
  file: File | null;
  name: string;
  size: number;
  status: DocumentStatus;
  errors: string[];
}

export interface WizardState {
  session: Session | null;
  selectedInsured: Insured | null;
  claimType: "GASTOS_MEDICOS" | "EMERGENCIA" | "CONSULTA" | null;
  documents: WizardDocument[];
  preRegistrationNumber: string | null;
}

