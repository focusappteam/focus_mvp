import Layout from "./components/layout/Layout";
import Board from "./features/board/Board";
import { TimerProvider } from "./contexts/TimerContext";
import { BoardProvider } from "./contexts/BoardContext";
import { useState } from "react";

function App() {
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

export default App;