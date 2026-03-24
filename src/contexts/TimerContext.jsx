import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from "react";
import { saveFocusSession } from '../utils/saveFocusSession';
import { useAuth } from '../contexts/AuthContext';

const POMODORO_DURATION = 1500; // 25 minutes
const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem("timerState");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        const now = Date.now();
        if (p.timers) {
          Object.values(p.timers).forEach(timer => {
            if (timer.isRunning && timer.startedAt) {
              const elapsed = Math.floor((now - timer.startedAt) / 1000);
              if (timer.mode === 'stopwatch') {
                // For stopwatch, add elapsed time
                timer.elapsedTime = (timer.elapsedTime || 0) + elapsed;
              } else {
                // For timer, subtract elapsed time
                timer.remainingTime = Math.max(0, timer.remainingTime - elapsed);
                if (timer.remainingTime === 0) {
                  timer.isRunning = false;
                  timer.startedAt = null;
                }
              }
            }
          });
        }
        return p;
      } catch {
        //
      }
    }
    return { taskId: null, timers: {} };
  });

  const { user } = useAuth();

  const intervalRef = useRef(null);
  const listenersRef = useRef({});
  const saveTimeroutRef = useRef(null);

  // persist
  useEffect(() => {
    clearTimeout(saveTimeroutRef.current);
    saveTimeroutRef.current = setTimeout(() => {
      localStorage.setItem("timerState", JSON.stringify(state));
    }, 2000);
    return () => clearTimeout(saveTimeroutRef.current);
  }, [state]);

  // countdown/countup interval
  const active = state.taskId && state.timers[state.taskId]?.isRunning;
  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const id = prev.taskId;
          if (!id) return prev;
          const timer = prev.timers[id];
          if (!timer || !timer.isRunning) return prev;

          // Stopwatch mode: count up
          if (timer.mode === 'stopwatch') {
            const newElapsed = (timer.elapsedTime || 0) + 1;
            return {
              ...prev,
              timers: {
                ...prev.timers,
                [id]: { ...timer, elapsedTime: newElapsed }
              }
            };
          }

          // Timer mode: count down
          const rem = timer.remainingTime - 1;
          if (rem <= 0) {
            clearInterval(intervalRef.current);
            const cb = listenersRef.current[id];
            const snapshot = listenersRef.current.__snapshot?.[id];
            let title;
            if (listenersRef.current.__title) {
              title = listenersRef.current.__title[id];
            }
            saveFocusSession({
              userId: user?.id,
              task: snapshot,
              mode: 'timer',
              durationSeconds: POMODORO_DURATION,
              startedAt: new Date(Date.now() - POMODORO_DURATION * 1000).toISOString(),
              endedAt: new Date().toISOString(),
            });
            if (cb) {
              try { cb(); } catch { }
              delete listenersRef.current[id];
            }
            if (listenersRef.current.__snapshot?.[id]) {
              delete listenersRef.current.__snapshot[id];
            }
            if (title) {
              delete listenersRef.current.__title[id];
            }
            if (Notification.permission === "granted") {
              new Notification("Focus Session Complete!", { body: title || "" });
            }
            return {
              taskId: null,
              timers: {
                ...prev.timers,
                [id]: { remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null, mode: 'timer', elapsedTime: 0 }
              }
            };
          }
          return {
            ...prev,
            timers: {
              ...prev.timers,
              [id]: { ...timer, remainingTime: rem }
            }
          };
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [active, user]);

  const start = useCallback((taskId, onComplete, taskTitle, taskSnapshot = null) => {
    if (onComplete) {
      listenersRef.current[taskId] = onComplete;
    }
    if (taskTitle) {
      listenersRef.current.__title = listenersRef.current.__title || {};
      listenersRef.current.__title[taskId] = `Buen trabajo en "${taskTitle}"!`;
    }
    listenersRef.current.__snapshot = listenersRef.current.__snapshot || {};
    listenersRef.current.__snapshot[taskId] = taskSnapshot;

    // ← Resetear flag al arrancar nueva sesión
    listenersRef.current.__saved = listenersRef.current.__saved || {};
    listenersRef.current.__saved[taskId] = false;



    setState(prev => {
      const now = Date.now();
      const newTimers = { ...prev.timers };

      // pause other running timers and save elapsed time
      Object.keys(newTimers).forEach(id => {
        if (id !== taskId && newTimers[id].isRunning) {
          const t = newTimers[id];
          const elapsed = t.startedAt ? Math.floor((now - t.startedAt) / 1000) : 0;
          if (t.mode === 'stopwatch') {
            newTimers[id] = {
              ...t,
              isRunning: false,
              startedAt: null,
              elapsedTime: (t.elapsedTime || 0) + elapsed
            };
          } else {
            newTimers[id] = {
              ...t,
              isRunning: false,
              startedAt: null,
              remainingTime: Math.max(0, t.remainingTime - elapsed)
            };
          }
        }
      });

      const existing = newTimers[taskId] || {
        remainingTime: POMODORO_DURATION,
        isRunning: false,
        startedAt: null,
        mode: 'timer',
        elapsedTime: 0
      };
      return {
        taskId,
        timers: {
          ...newTimers,
          [taskId]: { ...existing, isRunning: true, startedAt: now }
        }
      };
    });
  }, []);

  const pause = useCallback(() => {
    setState(prev => {
      const id = prev.taskId;
      if (!id) return prev;
      const timer = prev.timers[id];
      if (!timer || !timer.isRunning) return prev;

      if (timer.startedAt) {
        const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
        const snapshot = listenersRef.current.__snapshot?.[id];
        const alreadySaved = listenersRef.current.__saved?.[id];
        if (elapsed >= 10 && !alreadySaved) {
          listenersRef.current.__saved = listenersRef.current.__saved || {};
          listenersRef.current.__saved[id] = true;

          saveFocusSession({
            userId: user?.id,
            task: snapshot,
            mode: timer.mode,
            durationSeconds: elapsed,
            startedAt: new Date(timer.startedAt).toISOString(),
            endedAt: new Date().toISOString(),
          });
        }
      }
      // For stopwatch: elapsedTime is already updated by the interval, just stop
      // For timer: remainingTime is already updated by the interval, just stop
      return {
        ...prev,
        timers: {
          ...prev.timers,
          [id]: {
            ...timer,
            isRunning: false,
            startedAt: null
          }
        }
      };
    });
  }, [user]);

  const reset = useCallback(() => {
    setState(prev => {
      const id = prev.taskId;
      if (!id) return { taskId: null, timers: {} };
      const timer = prev.timers[id];
      return {
        taskId: null,
        timers: {
          ...prev.timers,
          [id]: {
            remainingTime: POMODORO_DURATION,
            isRunning: false,
            startedAt: null,
            mode: timer?.mode || 'timer',
            elapsedTime: 0
          }
        }
      };
    });
    listenersRef.current = {};
  }, []);

  const toggleMode = useCallback((taskId) => {
    setState(prev => {
      const timer = prev.timers[taskId];
      const currentMode = timer?.mode || 'timer';
      const newMode = currentMode === 'timer' ? 'stopwatch' : 'timer';

      return {
        ...prev,
        timers: {
          ...prev.timers,
          [taskId]: {
            remainingTime: POMODORO_DURATION,
            isRunning: false,
            startedAt: null,
            mode: newMode,
            elapsedTime: 0
          }
        }
      };
    });
  }, []);

  const value = useMemo(() => ({ state, start, pause, reset, toggleMode, POMODORO_DURATION }), [state, start, pause, reset, toggleMode]);

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider >
  );
}

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within a TimerProvider");
  return ctx;
};
