import { Timer } from "lucide-react";
import styles from "../focus-mode.module.css";
import { useFocusMode } from "../hooks/useFocusMode";
import { useOnboardingRef } from "../../../hooks/useOnboarding";

const FocusButton = ({ onEnterFocus }) => {
  const { isFocusActive } = useFocusMode(null)

  const focusBtnRef = useOnboardingRef("focus-mode-btn");

  return (
    <button
      ref={focusBtnRef}
      className={`${styles.focusBtn} ${!isFocusActive ? styles.focusBtnDisabled : ""}`}
      onClick={() => isFocusActive && onEnterFocus()}
      disabled={!isFocusActive}
    >
      <Timer size={14} /> MODO FOCUS
    </button>
  );
};

export default FocusButton;
