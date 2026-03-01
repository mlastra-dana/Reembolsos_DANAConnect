import React, { useCallback, useRef } from "react";
import type { DocumentCategory } from "../../types";

interface FileDropzoneProps {
  category: DocumentCategory;
  onFilesAdded: (files: File[], category: DocumentCategory) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ category, onFilesAdded }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const arr = Array.from(files);
      onFilesAdded(arr, category);
    },
    [category, onFilesAdded]
  );

  return (
    <div
      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-border bg-brand-surfaceSoft px-4 py-7 text-center text-xs text-brand-muted hover:border-brand-ink/35 hover:bg-brand-ink/5"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <p className="font-medium text-brand-ink">Arrastra y suelta archivos aquí</p>
      <p className="mt-1">
        o haz clic para seleccionar. Formatos permitidos: PDF, JPG, PNG.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

