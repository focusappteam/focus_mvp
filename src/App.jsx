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

function AppContent() {
  const [isFocusOverlayOpen, setIsFocusOverlayOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <TimerProvider>
      <BoardProvider>
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
      </BoardProvider>
    </TimerProvider>
  );
}

// ─── Componente auxiliar: rutas públicas ─────────────────────────────────────
// Si el usuario YA está autenticado y trata de ir a /login o /register,
// lo redirige directo a /app en lugar de mostrar el formulario de nuevo.
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // Mientras Supabase verifica sesión, no decidimos todavía
  if (loading) return null;

  // Si ya hay sesión activa → mandamos a la app
  if (user) return <Navigate to="/app" replace />;

  // Si no hay sesión → mostramos la ruta pública normalmente
  return children;
}

// ─── App: definición de rutas ────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* / → redirige siempre a /login para que haya una URL clara de entrada */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rutas públicas: si ya tienes sesión, te manda a /app */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Rutas privadas: ProtectedRoute verifica sesión antes de renderizar */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppContent />} />
        {/* Aquí más rutas privadas en el futuro:          */}
        {/* <Route path="/stats"    element={<Stats />} />          */}
        {/* <Route path="/settings" element={<Settings />} />       */}
      </Route>

      {/* Cualquier URL desconocida → redirige a /login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}