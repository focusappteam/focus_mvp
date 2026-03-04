import { useMemo, useCallback } from 'react';
import { useTimer } from '../../../contexts/TimerContext';

export function useTaskTimer(task) {
  const { state, start, pause, reset, toggleMode, POMODORO_DURATION } = useTimer();

  const taskId = task?.id;
  const timer = state.timers[taskId];

  // ── Estado derivado ───────────────────────────────────────
  const isThisTaskTimer = state.taskId === taskId;
  const isRunning = isThisTaskTimer && (timer?.isRunning ?? false);
  const isStopwatch = (timer?.mode ?? 'timer') === 'stopwatch';

  // ¿Hay otra tarea corriendo? → este task no puede iniciar
  const canStart = useMemo(() => {
    const otherRunning =
      state.taskId &&
      state.taskId !== taskId &&
      state.timers[state.taskId]?.isRunning;
    return !otherRunning;
  }, [state.taskId, state.timers, taskId]);

  // ── Tiempo a mostrar ──────────────────────────────────────
  const displaySeconds = useMemo(() => {
    if (!timer) return isStopwatch ? 0 : POMODORO_DURATION;
    return isStopwatch
      ? (timer.elapsedTime ?? 0)
      : (timer.remainingTime ?? POMODORO_DURATION);
  }, [timer, isStopwatch, POMODORO_DURATION]);

  const formattedTime = useMemo(() => {
    const mm = String(Math.floor(displaySeconds / 60)).padStart(2, '0');
    const ss = String(displaySeconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [displaySeconds]);

  // ── Progreso circular (para EditTaskModal) ────────────────
  const timerProgress = useMemo(() => {
    if (!timer) return 0;
    return isStopwatch
      ? Math.min((timer.elapsedTime ?? 0) / POMODORO_DURATION * 100, 100)
      : ((POMODORO_DURATION - (timer.remainingTime ?? POMODORO_DURATION)) / POMODORO_DURATION) * 100;
  }, [timer, isStopwatch, POMODORO_DURATION]);

  // ── Handlers ──────────────────────────────────────────────
  const handleStart = useCallback((onComplete) => {
    if (!taskId || !canStart) return;
    start(taskId, onComplete, task?.title);
  }, [taskId, canStart, start, task?.title]);

  const handlePause = useCallback((onSave) => {
    if (!isThisTaskTimer) return;
    // Guarda el tiempo transcurrido antes de pausar (igual que EditTaskModal)
    if (onSave && timer?.startedAt) {
      const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
      if (elapsed > 0) {
        onSave({
          ...task,
          timeActive: (task?.timeActive ?? 0) + elapsed,
        });
      }
    }
    pause();
  }, [isThisTaskTimer, timer, pause, task]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const handleToggleMode = useCallback(() => {
    if (!taskId || isRunning) return; // No cambiar mientras corre
    toggleMode(taskId);
  }, [taskId, isRunning, toggleMode]);

  return {
    // Estado
    isRunning,
    isStopwatch,
    canStart,
    displaySeconds,
    formattedTime,
    timerProgress,
    // Handlers
    handleStart,
    handlePause,
    handleReset,
    handleToggleMode,
  };
}
