import React, { useEffect, useState, useCallback } from 'react';
import { X, Coffee, CheckCircle, Check } from 'lucide-react';
import styles from './focus-mode.module.css';

const FocusOverlay = ({ activeTask, onExit, onCompleteTask, onUpdateTask }) => {
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

  const [isBreak, setIsBreak] = useState(false);
  const [breakTime, setBreakTime] = useState(5 * 60);
  const [checklist, setChecklist] = useState(activeTask?.checklist || []);

  const handleExit = useCallback(() => {
    onExit();
  }, [onExit]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') handleExit(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleExit]);

  useEffect(() => {
    const sync = setInterval(() => {
      if (isBreak) return;
      const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
      setIsRunning(saved.isRunning || false);
      if (saved.isRunning && saved.startedAt) {
        const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
        setTimeLeft(Math.max(0, (saved.remainingTime || 25 * 60) - elapsed));
      } else {
        setTimeLeft(saved.remainingTime || 25 * 60);
      }
    }, 500);
    return () => clearInterval(sync);
  }, [isBreak]);

  useEffect(() => {
    if (!isBreak) return;
    const interval = setInterval(() => {
      setBreakTime(prev => {
        if (prev <= 1) { clearInterval(interval); setIsBreak(false); return 5 * 60; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isBreak]);

  if (!activeTask) return null;

  const displayTime = isBreak ? breakTime : timeLeft;
  const minutes = String(Math.floor(displayTime / 60)).padStart(2, '0');
  const seconds = String(displayTime % 60).padStart(2, '0');

  const completedSubtasks = checklist.filter((s) => s.checked).length;
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
    onCompleteTask(activeTask.id);
    onExit();
  };

  const handlePauseResume = () => {
    const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
    if (isRunning) {
      const elapsed = saved.startedAt ? Math.floor((Date.now() - saved.startedAt) / 1000) : 0;
      const newRemaining = Math.max(0, (saved.remainingTime || 25 * 60) - elapsed);
      localStorage.setItem("globalTimer", JSON.stringify({
        ...saved, remainingTime: newRemaining, isRunning: false, startedAt: null
      }));
    } else {
      localStorage.setItem("globalTimer", JSON.stringify({
        ...saved, isRunning: true, startedAt: Date.now()
      }));
    }
  };

  const handleBreak = () => {
    const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
    if (saved.isRunning) {
      const elapsed = saved.startedAt ? Math.floor((Date.now() - saved.startedAt) / 1000) : 0;
      const newRemaining = Math.max(0, (saved.remainingTime || 25 * 60) - elapsed);
      localStorage.setItem("globalTimer", JSON.stringify({
        ...saved, remainingTime: newRemaining, isRunning: false, startedAt: null
      }));
    }
    setIsBreak(true);
    setBreakTime(5 * 60);
  };

  const handleBackToFocus = () => {
    const saved = JSON.parse(localStorage.getItem("globalTimer") || "{}");
    localStorage.setItem("globalTimer", JSON.stringify({
      ...saved, isRunning: true, startedAt: Date.now()
    }));
    setIsBreak(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <span className={styles.topBarTitle}>✦ {isBreak ? 'BREAK TIME' : 'FOCUS MODE'}</span>
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
          <div className={styles.subtaskRow}>
            <span className={styles.subtaskLabel}>
              {completedSubtasks} OF {totalSubtasks} SUBTASKS COMPLETE
            </span>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
            <span className={styles.progressPct}>{Math.round(progress)}%</span>
          </div>

          {totalSubtasks > 0 && (
            <div className={styles.checklistItems}>
              {checklist.map((item, index) => (
                <div
                  key={index}
                  className={`${styles.checklistItem} ${item.checked ? styles.checklistItemChecked : ''}`}
                  onClick={() => handleChecklistToggle(index)}
                >
                  <div className={`${styles.checkbox} ${item.checked ? styles.checkboxChecked : ''}`}>
                    {item.checked && <Check size={10} />}
                  </div>
                  <span className={styles.checklistText}>{item.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        {!isBreak && (
          <button className={styles.btnSecondary} onClick={handlePauseResume}>
            {isRunning ? '⏸ Pause' : '▶ Resume'}
          </button>
        )}
        {!isBreak && (
          <button className={styles.btnSecondary} onClick={handleBreak}>
            <Coffee size={14} /> Break
          </button>
        )}
        {isBreak && (
          <button className={styles.btnSecondary} onClick={handleBackToFocus}>
            ▶ Back to Focus
          </button>
        )}
        <button className={styles.btnPrimary} onClick={handleComplete}>
          <CheckCircle size={14} /> Complete Task
        </button>
      </div>

      <p className={styles.hint}>
        {isBreak ? 'Take a breather! You earned it. 🌿' : 'Press ESC to leave focus mode.'}
      </p>
    </div>
  );
};

export default FocusOverlay;