import { createContext, useContext, useState, useRef, useEffect } from "react";

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
              timer.remainingTime = Math.max(0, timer.remainingTime - elapsed);
              if (timer.remainingTime === 0) {
                timer.isRunning = false;
                timer.startedAt = null;
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

  const intervalRef = useRef(null);
  const listenersRef = useRef({});

  // persist
  useEffect(() => {
    localStorage.setItem("timerState", JSON.stringify(state));
  }, [state]);

  // countdown
  const active = state.taskId && state.timers[state.taskId]?.isRunning;
  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const id = prev.taskId;
          if (!id) return prev;
          const timer = prev.timers[id];
          if (!timer || !timer.isRunning) return prev;
          const rem = timer.remainingTime - 1;
          if (rem <= 0) {
            clearInterval(intervalRef.current);
            const cb = listenersRef.current[id];
            let title;
            if (listenersRef.current.__title) {
              title = listenersRef.current.__title[id];
            }
            if (cb) {
              try { cb(); } catch { }
              delete listenersRef.current[id];
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
                [id]: { remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null }
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
  }, [active, state.taskId]);

  const start = (taskId, onComplete, taskTitle) => {
    if (onComplete) {
      listenersRef.current[taskId] = onComplete;
    }
    if (taskTitle) {
      listenersRef.current.__title = listenersRef.current.__title || {};
      listenersRef.current.__title[taskId] = `Buen trabajo en "${taskTitle}"!`;
    }
    setState(prev => {
      const now = Date.now();
      const newTimers = { ...prev.timers };

      // pause other running timers and save elapsed time
      Object.keys(newTimers).forEach(id => {
        if (id !== taskId && newTimers[id].isRunning) {
          const t = newTimers[id];
          const elapsed = t.startedAt ? Math.floor((now - t.startedAt) / 1000) : 0;
          newTimers[id] = {
            ...t,
            isRunning: false,
            startedAt: null,
            remainingTime: Math.max(0, t.remainingTime - elapsed)
          };
        }
      });

      const existing = newTimers[taskId] || { remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null };
      return {
        taskId,
        timers: {
          ...newTimers,
          [taskId]: { ...existing, isRunning: true, startedAt: now }
        }
      };
    });
  };

  const pause = () => {
    setState(prev => {
      const id = prev.taskId;
      if (!id) return prev;
      const timer = prev.timers[id];
      if (!timer || !timer.isRunning) return prev;
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
  };

  const reset = () => {
    setState(prev => {
      const id = prev.taskId;
      if (!id) return { taskId: null, timers: {} };
      return {
        taskId: null,
        timers: {
          ...prev.timers,
          [id]: { remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null }
        }
      };
    });
    listenersRef.current = {};
  };

  return (
    <TimerContext.Provider value={{ state, start, pause, reset, POMODORO_DURATION }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within a TimerProvider");
  return ctx;
};
