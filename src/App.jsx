import Layout from "./components/layout/Layout";
import Board from "./features/board/Board";
import { TimerProvider } from "./contexts/TimerContext";

function App() {
  return (
    <TimerProvider>
      <Layout>
        <Board />
      </Layout>
    </TimerProvider>
  );
}

export default App;
