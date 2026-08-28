import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { useAuth } from "../contexts/AuthContext";
import { createFocusSession } from "../utils/createFocusSession";
import { finishFocusSession } from "../utils/finishFocusSession";
import { notifyExtension, FOCUS_EVENTS } from "../utils/notifyExtension";

const POMODORO_DURATION = 1500; // 25 minutes
const TimerContext = createContext(null);

function normalizeTimer(timer = {}) {
  return {
    remainingTime: timer.remainingTime ?? POMODORO_DURATION,
    elapsedTime: timer.elapsedTime ?? 0,
    isRunning: Boolean(timer.isRunning),
    startedAt: timer.startedAt ?? null,
    mode: timer.mode ?? "timer",
    focusSessionId: timer.focusSessionId ?? null, // CAMBIO: UUID de focus_sessions en Supabase
    taskSnapshot: timer.taskSnapshot ?? null,
  };
}

export function TimerProvider({ children }) {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem("timerState");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        const now = Date.now();
        const timers = {};
        if (p.timers) {
          Object.entries(p.timers ?? {}).forEach(([taskId, raw]) => {
            const timer = normalizeTimer(raw);
            if (timer.isRunning && timer.startedAt) {
              const elapsed = Math.floor((now - timer.startedAt) / 1000);
              if (timer.mode === "stopwatch") {
                // For stopwatch, add elapsed time
                timer.elapsedTime = (timer.elapsedTime || 0) + elapsed;
              } else {
                // For timer, subtract elapsed time
                timer.remainingTime = Math.max(
                  0,
                  timer.remainingTime - elapsed,
                );
                if (timer.remainingTime === 0) {
                  timer.isRunning = false;
                  timer.startedAt = null;
                }
              }
            }
            timers[taskId] = timer;
          });
        }

        return { taskId: p.taskId ?? null, timers: timers ?? {} };
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

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // persist
  useEffect(() => {
    clearTimeout(saveTimeroutRef.current);
    saveTimeroutRef.current = setTimeout(() => {
      localStorage.setItem("timerState", JSON.stringify(state));
    }, 2000);
    return () => clearTimeout(saveTimeroutRef.current);
  }, [state]);

  const completePomodoro = useCallback(
    async (taskId) => {
      const timer = stateRef.current.timers[taskId];
      if (!timer) return;

      const endedAt = new Date().toISOString();

      // CAMBIO: antes → saveFocusSession() INSERTABA una fila nueva.
      // Ahora → finishFocusSession() ACTUALIZA la fila que se creó en start().
      if (timer.focusSessionId) {
        try {
          await finishFocusSession({
            sessionId: timer.focusSessionId,
            durationSeconds: POMODORO_DURATION,
            endedAt,
          });
        } catch (e) {
          console.error("Could not finish completed session:", e);
        }
      }
      notifyExtension(FOCUS_EVENTS.COMPLETE, {
        focusSessionId: timer.focusSessionId,
        taskId,
        task: timer.taskSnapshot, // CAMBIO: snapshot leído del ESTADO, no de listenersRef.__snapshot
        durationSeconds: POMODORO_DURATION,
        userId: user?.id,
      });
      const cb = listenersRef.current[taskId];
      const title = listenersRef.current.__title?.[taskId];

      if (cb) {
        try {
          cb();
        } catch {}
        delete listenersRef.current[taskId];
      }
      if (listenersRef.current.__title?.[taskId]) {
        delete listenersRef.current.__title[taskId];
      }

      if (Notification.permission === "granted") {
        new Notification("Sesion de enfoque completada!", {
          body: title || "",
        });
      }

      setState((prev) => ({
        taskId: prev.taskId === taskId ? null : prev.taskId,
        timers: {
          ...prev.timers,
          [taskId]: {
            ...prev.timers[taskId],
            remainingTime: POMODORO_DURATION,
            elapsedTime: 0,
            isRunning: false,
            startedAt: null,
            focusSessionId: null, // CAMBIO: limpiar, la sesión ya se cerró
            taskSnapshot: null, // CAMBIO: limpiar
          },
        },
      }));
    },
    [user],
  );

  // countdown/countup interval
  const active = state.taskId && state.timers[state.taskId]?.isRunning;
  useEffect(() => {
    if (!active) return;
    if (active) {
      intervalRef.current = setInterval(() => {
        const id = stateRef.current.taskId;
        const timer = id ? stateRef.current.timers[id] : null;
        if (!id || !timer || !timer.isRunning) return;

        if (timer.mode === "stopwatch") {
          setState((prev) => {
            const t = prev.timers[id];
            if (!t || !t.isRunning) return prev;
            return {
              ...prev,
              timers: {
                ...prev.timers,
                [id]: { ...t, elapsedTime: (t.elapsedTime || 0) + 1 },
              },
            };
          });
          return;
        }
        if (timer.remainingTime - 1 <= 0) {
          clearInterval(intervalRef.current);
          completePomodoro(id);
          return;
        }
        setState((prev) => {
          const t = prev.timers[id];
          if (!t || !t.isRunning) return prev;
          return {
            ...prev,
            timers: {
              ...prev.timers,
              [id]: { ...t, remainingTime: t.remainingTime - 1 },
            },
          };
        });
      }, 1000);
      return () => clearInterval(intervalRef.current);
    }
  }, [active, completePomodoro]);

  const start = useCallback(
    async (taskId, onComplete, taskTitle, taskSnapshot = null) => {
      // CAMBIO: el snapshot ya NO es opcional. Sin tarea no hay fila en
      // focus_sessions, no hay focusSessionId y la extensión no puede
      // vincular actividad. Antes esto fallaba silenciosamente al pausar.
      if (!user?.id || !taskSnapshot?.id) {
        console.error(
          "start() requiere usuario autenticado y taskSnapshot con id",
        );
        return;
      }

      const now = Date.now();
      const startedAt = new Date(now).toISOString();

      // CAMBIO: cerrar la sesión del timer que estuviera corriendo antes.
      const prevId = stateRef.current.taskId;
      const prevTimer = prevId ? stateRef.current.timers[prevId] : null;

      if (
        prevId &&
        prevId !== taskId &&
        prevTimer?.isRunning &&
        prevTimer.focusSessionId &&
        prevTimer.startedAt
      ) {
        const prevElapsed = Math.floor((now - prevTimer.startedAt) / 1000);
        try {
          await finishFocusSession({
            sessionId: prevTimer.focusSessionId,
            durationSeconds: prevElapsed,
          });
        } catch (e) {
          console.error("Could not finish previous session:", e);
        }

        notifyExtension(FOCUS_EVENTS.PAUSE, {
          focusSessionId: prevTimer.focusSessionId,
          taskId: prevId,
          durationSeconds: prevElapsed,
        });
      }

      // CAMBIO: crear la sesión en Supabase ANTES de arrancar el timer.
      // De aquí sale el focusSessionId que consume la extensión.
      let session = null;
      try {
        session = await createFocusSession({
          userId: user.id,
          task: taskSnapshot,
          mode: "timer",
          startedAt,
        });
      } catch (e) {
        // CAMBIO: si no se pudo crear la sesión, el timer NO arranca.
        // Arrancar sin sesión dejaría a la extensión sin ID de referencia.
        console.error("Focus session was not created:", e);
        return;
      }

      // Callbacks (igual que tu versión)
      if (onComplete) {
        listenersRef.current[taskId] = onComplete;
      }
      if (taskTitle) {
        listenersRef.current.__title = listenersRef.current.__title || {};
        listenersRef.current.__title[taskId] =
          `Buen trabajo en "${taskTitle}"!`;
      }

      // CAMBIO: eliminados listenersRef.__snapshot y listenersRef.__saved.
      // - __snapshot ya no hace falta: el snapshot vive en el estado del timer
      //   (y por eso sobrevive recargas vía localStorage).
      // - __saved ya no hace falta: antes evitaba insertar dos veces al pausar;
      //   ahora pause() ACTUALIZA la sesión, no inserta, así que no hay riesgo
      //   de duplicados.

      setState((prev) => {
        const newTimers = { ...prev.timers };

        // Pausar otros timers en ejecución
        Object.keys(newTimers).forEach((id) => {
          if (id !== taskId && newTimers[id].isRunning) {
            const t = newTimers[id];
            const elapsed = t.startedAt
              ? Math.floor((now - t.startedAt) / 1000)
              : 0;
            if (t.mode === "stopwatch") {
              newTimers[id] = {
                ...t,
                isRunning: false,
                startedAt: null,
                elapsedTime: (t.elapsedTime || 0) + elapsed,
                focusSessionId: null,
              };
            } else {
              newTimers[id] = {
                ...t,
                isRunning: false,
                startedAt: null,
                remainingTime: Math.max(0, t.remainingTime - elapsed),
                focusSessionId: null,
              };
            }
          }
        });

        const existing = newTimers[taskId] || normalizeTimer();

        return {
          taskId,
          timers: {
            ...newTimers,
            [taskId]: {
              ...existing,
              isRunning: true,
              startedAt: now,
              focusSessionId: session.id, // guarda el UUID de focus_sessions
              taskSnapshot, // guarda snapshot en el ESTADO (persiste en localStorage)
            },
          },
        };
      });

      // notifica a la extensión DESPUÉS de crear la sesión,
      // para que siempre reciba un focusSessionId válido.
      notifyExtension(FOCUS_EVENTS.START, {
        focusSessionId: session.id,
        taskId,
        task: taskSnapshot,
        mode: "timer",
        startedAt,
        userId: user.id,
      });
    },
    [user],
  );

  const pause = useCallback(async () => {
    const id = stateRef.current.taskId;
    const timer = id ? stateRef.current.timers[id] : null;
    if (!id || !timer || !timer.isRunning) return;

    const now = Date.now();
    const endedAt = new Date(now).toISOString();
    const durationSeconds = timer.startedAt
      ? Math.floor((now - timer.startedAt) / 1000)
      : 0;

    if (timer.focusSessionId) {
      try {
        await finishFocusSession({
          sessionId: timer.focusSessionId,
          durationSeconds,
          endedAt,
        });
      } catch (e) {
        console.error("Could not finish paused session:", e);
      }
    }
    notifyExtension(FOCUS_EVENTS.PAUSE, {
      focusSessionId: timer.focusSessionId,
      taskId: id,
      durationSeconds,
      endedAt,
    });
    setState((prev) => {
      const current = prev.timers[id];
      if (!current) return prev;
      return {
        ...prev,
        timers: {
          ...prev.timers,
          [id]: {
            ...current,
            isRunning: false,
            startedAt: null,
            focusSessionId: null, // CAMBIO: la sesión ya se cerró
            // NOTA: taskSnapshot se CONSERVA por si el usuario reanuda;
            // start() lo reemplazará con uno fresco de todas formas.
          },
        },
      };
    });
  }, []);

  const reset = useCallback(async () => {
    const id = stateRef.current.taskId;
    const timer = id ? stateRef.current.timers[id] : null;

    if (timer?.isRunning && timer.focusSessionId) {
      const now = Date.now();
      const endedAt = new Date(now).toISOString();
      const durationSeconds = timer.startedAt
        ? Math.floor((now - timer.startedAt) / 1000)
        : 0;

      try {
        await finishFocusSession({
          sessionId: timer.focusSessionId,
          durationSeconds,
          endedAt,
        });
      } catch (e) {
        console.error("Could not finish session on reset:", e);
      }
      //la extensión deja de trackear
      notifyExtension(FOCUS_EVENTS.STOP, {
        focusSessionId: timer.focusSessionId,
        taskId: id,
        durationSeconds,
        endedAt,
      });
    }
    setState((prev) => {
      if (!id) return { taskId: null, timers: {} };
      const current = prev.timers[id];
      return {
        taskId: null,
        timers: {
          ...prev.timers,
          [id]: {
            remainingTime: POMODORO_DURATION,
            isRunning: false,
            startedAt: null,
            mode: current?.mode || "timer",
            elapsedTime: 0,
            focusSessionId: null, // CAMBIO: limpiar
            taskSnapshot: null, // CAMBIO: limpiar
          },
        },
      };
    });
    listenersRef.current = {};
  }, []);

  const toggleMode = useCallback(async (taskId) => {
    const timer = stateRef.current.timers[taskId];
    if (timer?.isRunning && timer.focusSessionId) {
      const now = Date.now();
      const durationSeconds = timer.startedAt
        ? Math.floor((now - timer.startedAt) / 1000)
        : 0;

      try {
        await finishFocusSession({
          sessionId: timer.focusSessionId,
          durationSeconds,
          endedAt: new Date(now).toISOString(),
        });
      } catch (e) {
        console.error("Could not finish session on mode toggle:", e);
      }

      notifyExtension(FOCUS_EVENTS.STOP, {
        focusSessionId: timer.focusSessionId,
        taskId,
        durationSeconds,
      });
    }

    setState((prev) => {
      const t = prev.timers[taskId];
      const currentMode = t?.mode || "timer";
      const newMode = currentMode === "timer" ? "stopwatch" : "timer";

      return {
        ...prev,
        timers: {
          ...prev.timers,
          [taskId]: {
            remainingTime: POMODORO_DURATION,
            isRunning: false,
            startedAt: null,
            mode: newMode,
            elapsedTime: 0,
            focusSessionId: null,
            taskSnapshot: t?.taskSnapshot ?? null, //  conservar snapshot
          },
        },
      };
    });
  }, []);

  const value = useMemo(
    () => ({ state, start, pause, reset, toggleMode, POMODORO_DURATION }),
    [state, start, pause, reset, toggleMode],
  );

  return (
    <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
  );
}

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within a TimerProvider");
  return ctx;
};
