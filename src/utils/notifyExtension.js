export const FOCUS_EVENTS = {
  START: "FOCUS_TIMER_START",
  PAUSE: "FOCUS_TIMER_PAUSE",
  STOP: "FOCUS_TIMER_STOP",
  COMPLETE: "FOCUS_TIMER_COMPLETE",
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
}
