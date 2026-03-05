import Layout from "./components/layout/Layout";
import Board from "./features/board/Board";
import { TimerProvider } from "./contexts/TimerContext";
import { useState } from "react";

function App() {
  const [isFocusOverlayOpen, setIsFocusOverlayOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <TimerProvider>
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
    </TimerProvider>
  );
}

export default App;