import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { BoardProvider } from "./contexts/BoardContext";
import { useState } from "react";
import Board from "./features/board/components/Board";
import { TimerProvider } from "./contexts/TimerContext";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [isFocusOverlayOpen, setIsFocusOverlayOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/app"
          element={
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
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;