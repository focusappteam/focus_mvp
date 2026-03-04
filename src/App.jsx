import Layout from "./components/layout/Layout";
import Board from "./features/board/components/Board";
import { useState } from "react";

function App() {
  const [isFocusOverlayOpen, setIsFocusOverlayOpen] = useState(false);
  return (
    <Layout onEnterFocus={() => setIsFocusOverlayOpen(true)}>
      <Board
        isFocusOverlayOpen={isFocusOverlayOpen}
        onExitFocus={() => setIsFocusOverlayOpen(false)}
      />
    </Layout>
  );
}

export default App;
