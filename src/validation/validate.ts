import type { Slot, ValidationResult } from "./types";

export async function validateForSlot(file: File, slot: Slot): Promise<ValidationResult> {
  void file;
  const docType =
    slot === "FACTURA" ? "FACTURA" : slot === "INFORME_RECETA" ? "INFORME_RECETA" : "EVIDENCIA";
  return {
    isValid: true,
    docType
  };
}
