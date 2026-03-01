import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { Stepper } from "./components/Stepper";
import { AuthPage } from "./pages/AuthPage";
import { SelectInsuredPage } from "./pages/SelectInsuredPage";
import { ClaimTypePage } from "./pages/ClaimTypePage";
import { UploadDocumentsPage } from "./pages/UploadDocumentsPage";
import { ReviewSubmitPage } from "./pages/ReviewSubmitPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { useSession } from "./store/WizardContext";
import { isSessionExpired, clearSession as clearSessionStorage } from "./utils/sessionStorage";
import { ToastProvider } from "./components/ui/ToastContext";
import { Alert } from "./components/ui/Alert";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, clear } = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location, reason: "no-session" }} />;
  }

  if (isSessionExpired(session)) {
    clearSessionStorage();
    clear();
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location, reason: "expired" }}
      />
    );
  }

  return <>{children}</>;
};

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const reason = (location.state as { reason?: string } | null)?.reason;

  return (
    <div className="app-container">
      <Header />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <Stepper />
        {reason === "expired" && (
          <div className="mb-4">
            <Alert
              type="warning"
              message="Tu sesión expiró. Por favor, inicia nuevamente."
            />
          </div>
        )}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/"
          element={
            <AppShell>
              <Navigate to="/auth" replace />
            </AppShell>
          }
        />
        <Route
          path="/auth"
          element={
            <AppShell>
              <AuthPage />
            </AppShell>
          }
        />
        <Route
          path="/asegurado"
          element={
            <AppShell>
              <ProtectedRoute>
                <SelectInsuredPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/siniestro"
          element={
            <AppShell>
              <ProtectedRoute>
                <ClaimTypePage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/documentos"
          element={
            <AppShell>
              <ProtectedRoute>
                <UploadDocumentsPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/resumen"
          element={
            <AppShell>
              <ProtectedRoute>
                <ReviewSubmitPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/confirmacion"
          element={
            <AppShell>
              <ProtectedRoute>
                <ConfirmationPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;

