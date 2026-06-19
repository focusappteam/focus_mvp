import { useEffect, useState, useCallback, useMemo } from "react";
import { X, Coffee, CheckCircle, Check } from "lucide-react";
import styles from "../focus-mode.module.css";
import { useFocusMode } from "../hooks/useFocusMode";
import { STRETCHES } from "../config/stretches";

const requestFullscreen = (elem) => {
  if (elem.requestFullscreen) return elem.requestFullscreen();
  if (elem.webkitRequestFullscreen) return elem.webkitRequestFullscreen();
  if (elem.mozRequestFullScreen) return elem.mozRequestFullScreen();
  if (elem.msRequestFullscreen) return elem.msRequestFullscreen();
  throw new Error('Fullscreen no soportado');
};

const exitFullscreen = () => {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
};

/* ── ActiveBreakCard ─────────────────────────────────────── */
const BREAK_DURATION = 5 * 60; // 300 s

function getActiveStretchIndex(elapsed) {
  let cum = 0;
  for (let i = 0; i < STRETCHES.length; i++) {
    cum += STRETCHES[i].durationSeconds;
    if (elapsed < cum) return i;
  }
  return STRETCHES.length - 1;
}

const ActiveBreakCard = ({ breakSeconds }) => {
  const elapsed = BREAK_DURATION - breakSeconds;
  const activeIndex = getActiveStretchIndex(elapsed);
  const activeStretch = STRETCHES[activeIndex];

  return (
    <div className={styles.breakCard}>
      <span className={styles.breakLabel}>ACTIVE BREAK</span>

      <div className={styles.cueContainer} key={activeIndex}>
        <p className={styles.cueText}>{activeStretch.cue}</p>
      </div>

      {/* dot indicators */}
      <div className={styles.dotRow}>
        {STRETCHES.map((s, i) => (
          <span
            key={i}
            className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ""} ${i < activeIndex ? styles.dotDone : ""}`}
          />
        ))}
      </div>

      <span className={styles.cueCounter}>
        {activeIndex + 1} / {STRETCHES.length}
      </span>
    </div>
  );
};


const FocusOverlay = ({ activeTask, startInBreakMode = false, onExit, onCompleteTask, onUpdateTask }) => {
  const {
    isRunning,
    isBreak,
    formattedTime,
    breakFormattedTime,
    breakSeconds,
    handlePauseResume,
    handleBreak,
    handleBackToFocus,
  } = useFocusMode(activeTask, startInBreakMode);

  const [checklist, setChecklist] = useState(activeTask?.checklist ?? []);

  const handleExit = useCallback(() => {
    exitFullscreen().catch(() => { });
    onExit()
  }, [onExit]);

  useEffect(() => {
    const el = document.documentElement;
    const enterFullscreen = async () => {
      try {
        await requestFullscreen(el);
        console.log('Entró fullscreen focus');
      } catch (err) {
        console.warn('Fullscreen denegado:', err);
      }
    };

    enterFullscreen();

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleExit();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        exitFullscreen().catch(() => { });
      }
    };
  }, []);

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") handleExit(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleExit]);

  if (!activeTask) return null;

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
    exitFullscreen().catch(() => { });
    onCompleteTask(activeTask.id);
    onExit();
  };
  const displayTime = isBreak ? breakFormattedTime : formattedTime;
  const [minutes, seconds] = displayTime.split(":")

  return (
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <span className={styles.topBarTitle}>
          {isBreak ? "ACTIVE BREAK" : "MODO FOCUS"}
        </span>
        <button className={styles.leaveBtn} onClick={handleExit}>
          <X size={14} /> SALIR DE LA SESION
        </button>
      </div>

      <div className={styles.timerWrapper}>
        <div className={styles.timer}>
          <span className={styles.timerDigits}>{minutes}</span>
          <span className={styles.timerColon}>:</span>
          <span className={styles.timerDigits}>{seconds}</span>
        </div>
        <div className={styles.timerLabels}>
          <span>MINUTOS</span>
          <span>SEGUNDOS</span>
        </div>
      </div>

      {/* ── Active Break stretching card ───────────────────── */}
      {isBreak && <ActiveBreakCard breakSeconds={breakSeconds} />}

      {/* ── Focus-mode task card (hidden during break) ──── */}
      {!isBreak && (
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
                    {completedSubtasks} DE {totalSubtasks} SUBTAREAS COMPLETADAS
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
      )}

      <div className={styles.controls}>
        {!isBreak && (
          <button className={styles.btnSecondary} onClick={handlePauseResume}>
            {isRunning ? "Pausar" : "Reanudar"}
          </button>
        )}
        {!isBreak && (
          <button className={styles.btnSecondary} onClick={handleBreak}>
            <Coffee size={14} /> Descanso
          </button>
        )}
        {isBreak && (
          <button className={styles.btnSecondary} onClick={handleBackToFocus}>
            Volver al enfoque
          </button>
        )}
        <button className={styles.btnPrimary} onClick={handleComplete}>
          <CheckCircle size={14} /> Completar tarea
        </button>
      </div>

      <p className={styles.hint}>
        {isBreak ? "Stretch it out — you earned it." : "Presiona ESC para salir del modo Focus."}
      </p>
    </div>
  );
};

export default FocusOverlay;