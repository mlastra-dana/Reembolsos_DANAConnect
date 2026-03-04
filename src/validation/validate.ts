import { classifyDocument } from "./classify";
import type { Slot, ValidationResult } from "./types";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasEvidenceFallbackHint(file: File): boolean {
  const name = normalizeName(file.name);
  return (
    /laboratorio|lab|resultado|resultados|rx|rayosx|torax|ecografia|eco|ultrasonido|mamografia|tac|tomografia|resonancia|inbody|examen|analisis|reporte|hemograma/.test(
      name
    )
  );
}

function invalidMessage(slot: Slot): string {
  if (slot === "FACTURA") return "El documento no corresponde a una factura o honorarios médicos.";
  if (slot === "INFORME_RECETA")
    return "El documento no corresponde a un informe o receta médica.";
  return "El documento no corresponde a un examen o resultado médico.";
}

export async function validateForSlot(file: File, slot: Slot): Promise<ValidationResult> {
  const { docType } = await classifyDocument(file);
  const evidenceFallbackValid =
    slot === "EVIDENCIA" && docType !== "FACTURA" && hasEvidenceFallbackHint(file);
  const isValid =
    (slot === "FACTURA" && docType === "FACTURA") ||
    (slot === "INFORME_RECETA" && docType === "INFORME_RECETA") ||
    // EVIDENCIA en modo demo: solo bloquea cruces claros (factura o informe/receta).
    (slot === "EVIDENCIA" &&
      (docType === "EVIDENCIA" ||
        evidenceFallbackValid ||
        (docType !== "FACTURA" && docType !== "INFORME_RECETA")));

  if (isValid) return { isValid: true, docType };
  return { isValid: false, docType, message: invalidMessage(slot) };
}
