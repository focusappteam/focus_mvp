export const FOCUS_EVENTS = {
  START: "FOCUS_TIMER_START",
  PAUSE: "FOCUS_TIMER_PAUSE",
  RESUME: "FOCUS_TIMER_RESUME",
  STOP: "FOCUS_TIMER_STOP",
  COMPLETE: "FOCUS_TIMER_COMPLETE",
  GET_HISTORY: "FOCUS_GET_HISTORY",
};

export function notifyExtension(type, payload = {}) {
  if (typeof window === "undefined") return;

  window.postMessage(
    {
      source: "FOCUS_WEB_APP",
      type,
      timestamp: Date.now(),
      payload,
    },
    "*",
  );
  console.log(type);
}
export function getFocusHistory() {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve([]);
      return;
    }

    const handler = (event) => {
      // Filtrar solo respuestas del content script
      if (
        event.data?.source !== "FOCUS_EXTENSION_CONTENT" ||
        event.data?.type !== "FOCUS_TIMER_HISTORY_RESPONSE"
      ) {
        return;
      }

      window.removeEventListener("message", handler);
      resolve(event.data?.payload?.history || []);
    };

    window.addEventListener("message", handler);

    // Enviar la petición
    notifyExtension(FOCUS_EVENTS.GET_HISTORY, {});

    // Timeout por seguridad (si el content no responde en 2 segundos)
    setTimeout(() => {
      window.removeEventListener("message", handler);
      resolve([]);
    }, 2000);
  });
}
