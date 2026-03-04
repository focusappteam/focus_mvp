import Layout from "./components/layout/Layout";
import { useState } from "react";
import Board from "./features/board/components/Board";

function App() {
  const [isFocusOverlayOpen, setIsFocusOverlayOpen] = useState(false);

  return (
    <Layout onEnterFocus={() => setIsFocusOverlayOpen(true)}>
      <Board
        isFocusOverlayOpen={isFocusOverlayOpen}
        onExitFocus={() => setIsFocusOverlayOpen(false)}
        onTimerComplete={() => setIsFocusOverlayOpen(false)}
      />
    </Layout>
  );
}

export default App;
