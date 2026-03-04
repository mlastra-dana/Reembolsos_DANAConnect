import { classifyDocument } from "./classify";
import type { Slot, ValidationResult } from "./types";

function unknownMessage(slot: Slot): string {
  if (slot === "FACTURA") return "El documento no corresponde a una factura o recibo.";
  if (slot === "INFORME_RECETA")
    return "El documento no corresponde a un informe o receta médica.";
  return "El documento no corresponde a un examen o resultado médico.";
}

export async function validateForSlot(file: File, slot: Slot): Promise<ValidationResult> {
  const { docType } = await classifyDocument(file);

  const isValid =
    (slot === "FACTURA" && docType === "FACTURA") ||
    (slot === "INFORME_RECETA" && docType === "INFORME_RECETA") ||
    (slot === "EVIDENCIA" && docType === "EVIDENCIA");

  if (isValid) {
    return { isValid: true, docType };
  }

  return {
    isValid: false,
    docType,
    message: unknownMessage(slot)
  };
}
