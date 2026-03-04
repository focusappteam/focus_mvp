import { Timer } from "lucide-react";
import { useTimer } from "../../../contexts/TimerContext";
import styles from "./focus-mode.module.css";

const FocusButton = ({ onEnterFocus }) => {
  const { state } = useTimer();
  const isActive = state.taskId && state.timers[state.taskId]?.isRunning;

  return (
    <button
      className={`${styles.focusBtn} ${!isActive ? styles.focusBtnDisabled : ""}`}
      onClick={() => isActive && onEnterFocus()}
      disabled={!isActive}
    >
      <Timer size={14} /> FOCUS MODE
    </button>
  );
};

export default FocusButton;
