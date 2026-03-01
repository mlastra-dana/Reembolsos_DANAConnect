import React, { createContext, useCallback, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { Alert } from "./Alert";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToasts((prev) => [...prev, { id: Date.now(), type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center">
          <div className="flex w-full max-w-md flex-col gap-2 px-4">
            {toasts.map((t) => (
              <div key={t.id} className="pointer-events-auto">
                <Alert type={t.type} message={t.message} />
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

