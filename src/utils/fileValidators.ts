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
  // No bloquear por naming del archivo: usuarios suelen subir nombres genéricos
  // como IMG_1234, scan, etc. Mantenemos validaciones por tipo y tamaño.
  void category;
  void name;
  return true;
}
