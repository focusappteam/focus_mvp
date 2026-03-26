import { Timer } from "lucide-react";
import styles from "../focus-mode.module.css";
import { useFocusMode } from "../hooks/useFocusMode";


const FocusButton = ({ onEnterFocus }) => {
  const { isFocusActive } = useFocusMode(null)

  return (
    <button
      className={`${styles.focusBtn} ${!isFocusActive ? styles.focusBtnDisabled : ""}`}
      onClick={() => isFocusActive && onEnterFocus()}
      disabled={!isFocusActive}
    >
      <Timer size={14} /> MODO FOCUS
    </button>
  );
};

export default FocusButton;
