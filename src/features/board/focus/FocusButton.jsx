import React from 'react';
import styles from './focus-mode.module.css';

const FocusButton = ({ onEnterFocus }) => {
  const globalTimer = JSON.parse(localStorage.getItem("globalTimer") || "{}");
  const isActive = globalTimer.taskId && globalTimer.isRunning;

  return (
    <button
      className={`${styles.focusBtn} ${!isActive ? styles.focusBtnDisabled : ''}`}
      onClick={() => isActive && onEnterFocus()}
      disabled={!isActive}
      title={!isActive ? 'Inicia el timer de una tarea para activar Focus Mode' : 'Entrar en modo focus'}
    >
      ✦ FOCUS MODE
    </button>
  );
};

export default FocusButton;