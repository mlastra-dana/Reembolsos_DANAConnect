import { CONFIG } from "../config";
import type { DocumentCategory } from "../types";

const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];

export function isAllowedFileType(file: File): boolean {
  const lower = file.name.toLowerCase();
  return allowedExtensions.some((ext) => lower.endsWith(ext));
}

export function isFileLargeEnough(file: File): boolean {
  const minBytes = CONFIG.fileMinSizeKb * 1024;
  return file.size >= minBytes;
}

export function isNameValidForCategory(category: DocumentCategory, name: string): boolean {
  const lower = name.toLowerCase();
  if (category === "FACTURA") {
    return ["factura", "boleta", "invoice", "recibo"].some((k) => lower.includes(k));
  }
  if (category === "MEDICO") {
    return ["informe", "receta", "medical", "rx", "diagnostico", "diagnóstico"].some((k) =>
      lower.includes(k)
    );
  }
  return true;
}

