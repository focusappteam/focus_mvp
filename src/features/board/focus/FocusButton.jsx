import React from 'react';
import { Timer } from 'lucide-react';
import styles from './focus-mode.module.css';

const FocusButton = ({ onEnterFocus }) => {
  const globalTimer = JSON.parse(localStorage.getItem("globalTimer") || "{}");
  const isActive = globalTimer.taskId && globalTimer.isRunning;

  return (
    <button
      className={`${styles.focusBtn} ${!isActive ? styles.focusBtnDisabled : ''}`}
      onClick={() => isActive && onEnterFocus()}
      disabled={!isActive}
    >
      <Timer size={14} />
      FOCUS MODE
    </button>
  );
};

export default FocusButton;