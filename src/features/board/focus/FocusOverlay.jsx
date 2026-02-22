import React, { useEffect, useState } from 'react';
import styles from './focus-mode.module.css';

const FocusOverlay = ({ activeTask, onExit, onCompleteTask }) => {

  const [timeLeft, setTimeLeft] = useState(() => {
  const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
  if (saved.isRunning && saved.startedAt) {
    const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
    return Math.max(0, (saved.remainingTime || 25 * 60) - elapsed);
  }
  return saved.remainingTime || 25 * 60;
});

const [isRunning, setIsRunning] = useState(() => {
  const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
  return saved.isRunning || false;
});

  useEffect(() => {
    const sync = setInterval(() => {
      const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
      setIsRunning(saved.isRunning || false);

      if (saved.isRunning && saved.startedAt) {
        const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
        const remaining = Math.max(0, (saved.remainingTime || 25 * 60) - elapsed);
        setTimeLeft(remaining);
      } else {
        setTimeLeft(saved.remainingTime || 25 * 60);
      }
    }, 500);
    return () => clearInterval(sync);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    return () => {
      if (document.fullscreenElement && document.exitFullscreen)
        document.exitFullscreen().catch(() => {});
    };
  }, []);

  if (!activeTask) return null;

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const seconds = String(timeLeft % 60).padStart(2, '0');

  const completedSubtasks = activeTask.checklist?.filter((s) => s.checked).length ?? 0;
  const totalSubtasks = activeTask.checklist?.length ?? 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleExit = () => {
    if (document.fullscreenElement && document.exitFullscreen)
      document.exitFullscreen().catch(() => {});
    onExit();
  };

  const handleComplete = () => {
    if (document.fullscreenElement && document.exitFullscreen)
      document.exitFullscreen().catch(() => {});
    onCompleteTask(activeTask.id);
    onExit();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <span className={styles.topBarTitle}>✦ FOCUS MODE</span>
        <button className={styles.leaveBtn} onClick={handleExit}>LEAVE SESSION ↗</button>
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
            <div className={styles.subtaskRow}>
              <span className={styles.subtaskLabel}>
                {completedSubtasks} OF {totalSubtasks} SUBTASKS COMPLETE
              </span>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progressPct}>{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>

      <div className={styles.controls}>
  <button className={styles.btnSecondary} onClick={() => {
    const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
    if (isRunning) {
      const elapsed = saved.startedAt ? Math.floor((Date.now() - saved.startedAt) / 1000) : 0;
      const newRemaining = Math.max(0, (saved.remainingTime || 25 * 60) - elapsed);
      localStorage.setItem("globalTimer", JSON.stringify({
        ...saved,
        remainingTime: newRemaining,
        isRunning: false,
        startedAt: null
      }));
    } else {
      localStorage.setItem("globalTimer", JSON.stringify({
        ...saved,
        isRunning: true,
        startedAt: Date.now()
      }));
    }
  }}>
    {isRunning ? '⏸ Pause' : '▶ Resume'}
  </button>
  <button className={styles.btnPrimary} onClick={handleComplete}>
    ✓ Complete Task
  </button>
</div>

      <p className={styles.hint}>
        Short breaks help you maintain focus and productivity. Take a 5-minute break every 25 minutes.
      </p>
    </div>
  );
};

export default FocusOverlay;