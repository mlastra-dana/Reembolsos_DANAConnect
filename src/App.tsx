import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthPage } from "./pages/AuthPage";
import { SelectInsuredPage } from "./pages/SelectInsuredPage";
import { ClaimTypePage } from "./pages/ClaimTypePage";
import { UploadDocumentsPage } from "./pages/UploadDocumentsPage";
import { ReviewSubmitPage } from "./pages/ReviewSubmitPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { LandingPage } from "./pages/LandingPage";
import { useSession } from "./store/WizardContext";
import { isSessionExpired, clearSession as clearSessionStorage } from "./utils/sessionStorage";
import { ToastProvider } from "./components/ui/ToastContext";
import { AppShell } from "./components/layout/AppShell";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, clear } = useSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/wizard/auth" replace state={{ from: location, reason: "no-session" }} />;
  }

  if (isSessionExpired(session)) {
    clearSessionStorage();
    clear();
    return (
      <Navigate
        to="/wizard/auth"
        replace
        state={{ from: location, reason: "expired" }}
      />
    );
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  React.useEffect(() => {
    document.title = "DANAconnect – Portal de preregistro de reembolsos (Demo)";
  }, []);

  return (
    <ToastProvider>
      <Routes>
        <Route
          path="/"
          element={
            <AppShell showStepper={false}>
              <LandingPage />
            </AppShell>
          }
        />
        <Route
          path="/wizard"
          element={<Navigate to="/wizard/auth" replace />}
        />
        <Route
          path="/wizard/auth"
          element={
            <AppShell>
              <AuthPage />
            </AppShell>
          }
        />
        <Route
          path="/wizard/asegurado"
          element={
            <AppShell>
              <ProtectedRoute>
                <SelectInsuredPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/wizard/siniestro"
          element={
            <AppShell>
              <ProtectedRoute>
                <ClaimTypePage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/wizard/documentos"
          element={
            <AppShell>
              <ProtectedRoute>
                <UploadDocumentsPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/wizard/resumen"
          element={
            <AppShell>
              <ProtectedRoute>
                <ReviewSubmitPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route
          path="/wizard/confirmacion"
          element={
            <AppShell>
              <ProtectedRoute>
                <ConfirmationPage />
              </ProtectedRoute>
            </AppShell>
          }
        />
        <Route path="/auth" element={<Navigate to="/wizard/auth" replace />} />
        <Route path="/asegurado" element={<Navigate to="/wizard/asegurado" replace />} />
        <Route path="/siniestro" element={<Navigate to="/wizard/siniestro" replace />} />
        <Route path="/documentos" element={<Navigate to="/wizard/documentos" replace />} />
        <Route path="/resumen" element={<Navigate to="/wizard/resumen" replace />} />
        <Route path="/confirmacion" element={<Navigate to="/wizard/confirmacion" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
};

export default App;
