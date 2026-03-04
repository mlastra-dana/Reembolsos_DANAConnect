export type Slot = "FACTURA" | "INFORME_RECETA" | "EVIDENCIA";

export type DocType = "FACTURA" | "INFORME_RECETA" | "EVIDENCIA" | "UNKNOWN";

export type ValidationResult = {
  isValid: boolean;
  docType: DocType;
  message?: string;
};
