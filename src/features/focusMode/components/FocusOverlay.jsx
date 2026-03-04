import { useEffect, useState, useCallback } from "react";
import { X, Coffee, CheckCircle, Check } from "lucide-react";
import { useTimer } from "../../../contexts/TimerContext";
import styles from "../focus-mode.module.css";

const FocusOverlay = ({ activeTask, onExit, onCompleteTask, onUpdateTask }) => {
  const { state, start, pause, POMODORO_DURATION } = useTimer();

  const timer = state.timers[activeTask?.id];
  const isRunning = timer?.isRunning ?? false;
  const isStopWatch = timer?.mode === 'stopwatch';

  const [isBreak, setIsBreak] = useState(false);
  const [breakTime, setBreakTime] = useState(5 * 60);
  const [checklist, setChecklist] = useState(activeTask?.checklist ?? []);

  const handleExit = useCallback(() => onExit(), [onExit]);

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") handleExit(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleExit]);

  // Countdown del break (local, no necesita contexto)
  useEffect(() => {
    if (!isBreak) return;
    const interval = setInterval(() => {
      setBreakTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsBreak(false);
          return 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBreak]);

  if (!activeTask) return null;

  const displayTime = isBreak
    ? breakTime
    : isStopWatch
      ? (timer?.elapsedTime ?? 0)
      : (timer?.remainingTime ?? POMODORO_DURATION);
  const minutes = String(Math.floor(displayTime / 60)).padStart(2, "0");
  const seconds = String(displayTime % 60).padStart(2, "0");

  const completedSubtasks = checklist.filter(s => s.checked).length;
  const totalSubtasks = checklist.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleChecklistToggle = (index) => {
    const newChecklist = checklist.map((item, i) =>
      i === index ? { ...item, checked: !item.checked } : item
    );
    setChecklist(newChecklist);
    if (onUpdateTask) onUpdateTask({ ...activeTask, checklist: newChecklist });
  };

  const handleComplete = () => {
    handlePauseResume();
    onCompleteTask(activeTask.id);
    onExit();
  };

  const handlePauseResume = () => {
    if (isRunning) {
      pause();
    } else {
      start(activeTask.id);
    }
  };

  const handleBreak = () => {
    if (isRunning) pause();
    setIsBreak(true);
    setBreakTime(5 * 60);
  };

  const handleBackToFocus = () => {
    setIsBreak(false);
    start(activeTask.id);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <span className={styles.topBarTitle}>
          {isBreak ? "BREAK TIME" : "FOCUS MODE"}
        </span>
        <button className={styles.leaveBtn} onClick={handleExit}>
          <X size={14} /> LEAVE SESSION
        </button>
      </div>

      <div className={styles.timerWrapper}>
        <div className={styles.timer}>
          <span className={styles.timerDigits}>{minutes}</span>
          <span className={styles.timerColon}>:</span>
          <span className={styles.timerDigits}>{seconds}</span>
        </div>
        <div className={styles.timerLabels}>
          <span>MINUTES</span>
          <span>SECONDS</span>
        </div>
      </div>

      <div className={styles.taskCard}>
        <div className={styles.taskInfo}>
          <h2 className={styles.taskTitle}>{activeTask.title}</h2>
          {activeTask.description && (
            <p className={styles.taskDesc}>{activeTask.description}</p>
          )}


          {totalSubtasks > 0 && (
            <>
              <div className={styles.subtaskRow}>
                <span className={styles.subtaskLabel}>
                  {completedSubtasks} OF {totalSubtasks} SUBTASKS COMPLETE
                </span>

                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <span className={styles.progressPct}>{Math.round(progress)}%</span>
              </div>

              <div className={styles.checklistItems}>
                {checklist.map((item, index) => (
                  <div
                    key={index}
                    className={`${styles.checklistItem} ${item.checked ? styles.checklistItemChecked : ""}`}
                    onClick={() => handleChecklistToggle(index)}
                  >
                    <div className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ""}`}>
                      {item.checked && <Check size={10} />}
                    </div>
                    <span className={styles.checklistText}>{item.text}</span>
                  </div>
                ))}
              </div>

            </>
          )}
        </div></div>

      <div className={styles.controls}>
        {!isBreak && (
          <button className={styles.btnSecondary} onClick={handlePauseResume}>
            {isRunning ? "Pause" : "Resume"}
          </button>
        )}
        {!isBreak && (
          <button className={styles.btnSecondary} onClick={handleBreak}>
            <Coffee size={14} /> Break
          </button>
        )}
        {isBreak && (
          <button className={styles.btnSecondary} onClick={handleBackToFocus}>
            Back to Focus
          </button>
        )}
        <button className={styles.btnPrimary} onClick={handleComplete}>
          <CheckCircle size={14} /> Complete Task
        </button>
      </div>

      <p className={styles.hint}>
        {isBreak ? "Take a breather! You earned it." : "Press ESC to leave focus mode."}
      </p>
    </div>
  );
};

export default FocusOverlay;