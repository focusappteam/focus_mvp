import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { BoardProvider } from "./contexts/BoardContext";
import { useState } from "react";
import Board from "./features/board/components/Board";
import { TimerProvider } from "./contexts/TimerContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import OnboardingOverlay from "./components/onboarding/OnboardingOverlay";
import { OnboardingProvider } from "./contexts/OnboardingContext";

function AppContent() {
  const [isFocusOverlayOpen, setIsFocusOverlayOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <TimerProvider>
      <BoardProvider>
        <OnboardingProvider>
          <Layout
            onEnterFocus={() => setIsFocusOverlayOpen(true)}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          >
            <Board
              isFocusOverlayOpen={isFocusOverlayOpen}
              onExitFocus={() => setIsFocusOverlayOpen(false)}
              sidebarOpen={sidebarOpen}
            />
          </Layout>

          <OnboardingOverlay />
        </OnboardingProvider>
      </BoardProvider>
    </TimerProvider>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppContent />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}