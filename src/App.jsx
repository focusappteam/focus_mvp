import Layout from "./components/layout/Layout";
import Board from "./features/board/components/Board";
import { TimerProvider } from "./contexts/TimerContext";
import { useState } from "react";

function App() {
  const [isFocusOverlayOpen, setIsFocusOverlayOpen] = useState(false);
  return (
    <TimerProvider>
      <Layout onEnterFocus={() => setIsFocusOverlayOpen(true)}>
        <Board isFocusOverlayOpen={isFocusOverlayOpen}
          onExitFocus={() => setIsFocusOverlayOpen(false)} />
      </Layout>
    </TimerProvider>
  );
}

export default App;
