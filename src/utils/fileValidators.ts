import { CONFIG } from "../config";
import type { DocumentCategory } from "../types";

const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];

export function getFileExtension(name: string): string {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

export function isAllowedFileType(file: File): boolean {
  const ext = getFileExtension(file.name);
  return allowedMimeTypes.includes(file.type) || allowedExtensions.includes(ext);
}

export function isFileLargeEnough(file: File): boolean {
  const minBytes = CONFIG.fileMinSizeKb * 1024;
  return file.size >= minBytes;
}

export function isFileSmallEnough(file: File): boolean {
  const maxBytes = CONFIG.fileMaxSizeMb * 1024 * 1024;
  return file.size <= maxBytes;
}

export function isNameValidForCategory(category: DocumentCategory, name: string): boolean {
  // No bloquear por naming del archivo: usuarios suelen subir nombres genéricos
  // como IMG_1234, scan, etc. Mantenemos validaciones por tipo y tamaño.
  void category;
  void name;
  return true;
}
