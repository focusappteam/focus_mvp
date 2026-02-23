import { createContext, useContext, useState, useRef, useEffect } from "react";

const POMODORO_DURATION = 1500; // 25 minutes
const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem("globalTimer");
    if (saved) {
      const p = JSON.parse(saved);
      if (p.isRunning && p.startedAt) {
        const elapsed = Math.floor((Date.now() - p.startedAt) / 1000);
        const remaining = Math.max(0, p.remainingTime - elapsed);
        return { ...p, remainingTime: remaining };
      }
      return p;
    }
    return { taskId: null, remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null };
  });

  const intervalRef = useRef(null);
  const listenersRef = useRef({});

  // persist
  useEffect(() => {
    localStorage.setItem("globalTimer", JSON.stringify(state));
  }, [state]);

  // countdown
  useEffect(() => {
    if (state.isRunning) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const rem = prev.remainingTime - 1;
          if (rem <= 0) {
            clearInterval(intervalRef.current);
            // notify listener if exists
            const cb = listenersRef.current[prev.taskId];
            let title;
            if (listenersRef.current.__title) {
              title = listenersRef.current.__title[prev.taskId];
            }
            if (cb) {
              try { cb(); } catch {};
              delete listenersRef.current[prev.taskId];
            }
            if (title) {
              delete listenersRef.current.__title[prev.taskId];
            }
            if (Notification.permission === "granted") {
              new Notification("Focus Session Complete!", { body: title || "" });
            }
            return { taskId: null, remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null };
          }
          return { ...prev, remainingTime: rem };
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [state.isRunning]);

  const start = (taskId, onComplete, taskTitle) => {
    if (onComplete) {
      listenersRef.current[taskId] = onComplete;
    }
    if (taskTitle) {
      listenersRef.current.__title = listenersRef.current.__title || {};
      listenersRef.current.__title[taskId] = `Great work on "${taskTitle}"!`;
    }
    setState(prev => ({
      taskId,
      remainingTime: prev.taskId === taskId ? prev.remainingTime : POMODORO_DURATION,
      isRunning: true,
      startedAt: Date.now()
    }));
  };

  const pause = () => {
    setState(s => ({ ...s, isRunning: false, startedAt: null }));
  };

  const reset = () => {
    setState({ taskId: null, remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null });
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
