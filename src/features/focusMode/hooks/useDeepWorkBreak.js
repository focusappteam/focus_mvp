import { useState, useRef, useEffect, useCallback } from "react";
import { useTimer } from "../../../contexts/TimerContext";

const ACC_STORAGE_KEY = "focus.dwBreak.accumulated";
const POSTPONE_STORAGE_KEY = "focus.dwBreak.postponeAt";

/**
 * Tracks cumulative deep-work time (across tasks and pauses) and fires a
 * one-shot prompt when the threshold is reached.
 *
 *  - Counter ticks only while a task timer is running.
 *  - Postpone re-shows the same prompt in 5 min, without resetting the counter.
 *  - Deny resets the counter; another 90 min of running time is required.
 *  - Accept opens the active break (consumed by <StretchWindow />).
 *  - State is persisted to localStorage so a page refresh mid-cycle is
 *    recovered.
 */
export function useDeepWorkBreak(thresholdSeconds = 5400, postponeMs = 5 * 60 * 1000) {
    const { state } = useTimer();
    const isRunning = !!(state.taskId && state.timers[state.taskId]?.isRunning);

    const [isPromptOpen, setIsPromptOpen] = useState(false);
    const [isBreakActive, setIsBreakActive] = useState(false);
    const [isPostponeScheduled, setIsPostponeScheduled] = useState(false);

    const accumulatedRef = useRef(0);
    const isRunningRef = useRef(false);
    const isPromptOpenRef = useRef(false);
    const isBreakActiveRef = useRef(false);
    const isPostponeScheduledRef = useRef(false);
    const intervalRef = useRef(null);
    const postponeTimeoutRef = useRef(null);

    useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
    useEffect(() => { isPromptOpenRef.current = isPromptOpen; }, [isPromptOpen]);
    useEffect(() => { isBreakActiveRef.current = isBreakActive; }, [isBreakActive]);
    useEffect(() => { isPostponeScheduledRef.current = isPostponeScheduled; }, [isPostponeScheduled]);

    const schedulePostponeTimer = useCallback((ms, deadlineMs) => {
        if (postponeTimeoutRef.current) {
            clearTimeout(postponeTimeoutRef.current);
            postponeTimeoutRef.current = null;
        }
        setIsPostponeScheduled(true);
        try {
            localStorage.setItem(POSTPONE_STORAGE_KEY, String(deadlineMs));
        } catch {
            //
        }
        postponeTimeoutRef.current = setTimeout(() => {
            setIsPostponeScheduled(false);
            setIsPromptOpen(true);
            try {
                localStorage.removeItem(POSTPONE_STORAGE_KEY);
            } catch {
                //
            }
            postponeTimeoutRef.current = null;
        }, ms);
    }, []);

    useEffect(() => {
        try {
            const accRaw = localStorage.getItem(ACC_STORAGE_KEY);
            if (accRaw) {
                const acc = parseInt(accRaw, 10);
                if (!Number.isNaN(acc) && acc > 0) {
                    accumulatedRef.current = acc;
                }
            }
            const postponeAtRaw = localStorage.getItem(POSTPONE_STORAGE_KEY);
            if (postponeAtRaw) {
                const postponeAt = parseInt(postponeAtRaw, 10);
                if (!Number.isNaN(postponeAt)) {
                    const now = Date.now();
                    if (postponeAt > now) {
                        schedulePostponeTimer(postponeAt - now, postponeAt);
                    } else {
                        localStorage.removeItem(POSTPONE_STORAGE_KEY);
                    }
                }
            }
        } catch {
            //
        }
    }, [schedulePostponeTimer]);

    useEffect(() => {
        if (!isRunning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }
        intervalRef.current = setInterval(() => {
            if (!isRunningRef.current) return;
            accumulatedRef.current += 1;
            try {
                localStorage.setItem(ACC_STORAGE_KEY, String(accumulatedRef.current));
            } catch {
                //
            }
            if (
                accumulatedRef.current >= thresholdSeconds &&
                !isPromptOpenRef.current &&
                !isBreakActiveRef.current &&
                !isPostponeScheduledRef.current
            ) {
                setIsPromptOpen(true);
            }
        }, 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isRunning, thresholdSeconds]);

    useEffect(() => () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (postponeTimeoutRef.current) clearTimeout(postponeTimeoutRef.current);
    }, []);

    const clearPersisted = useCallback(() => {
        try {
            localStorage.removeItem(ACC_STORAGE_KEY);
        } catch {
            //
        }
        try {
            localStorage.removeItem(POSTPONE_STORAGE_KEY);
        } catch {
            //
        }
    }, []);

    const accept = useCallback(() => {
        setIsPromptOpen(false);
        setIsBreakActive(true);
        accumulatedRef.current = 0;
        if (postponeTimeoutRef.current) {
            clearTimeout(postponeTimeoutRef.current);
            postponeTimeoutRef.current = null;
        }
        setIsPostponeScheduled(false);
        clearPersisted();
    }, [clearPersisted]);

    const deny = useCallback(() => {
        setIsPromptOpen(false);
        accumulatedRef.current = 0;
        if (postponeTimeoutRef.current) {
            clearTimeout(postponeTimeoutRef.current);
            postponeTimeoutRef.current = null;
        }
        setIsPostponeScheduled(false);
        clearPersisted();
    }, [clearPersisted]);

    const postpone = useCallback(() => {
        setIsPromptOpen(false);
        const deadline = Date.now() + postponeMs;
        schedulePostponeTimer(postponeMs, deadline);
    }, [postponeMs, schedulePostponeTimer]);

    const finishBreak = useCallback(() => {
        setIsBreakActive(false);
        accumulatedRef.current = 0;
        try {
            localStorage.removeItem(ACC_STORAGE_KEY);
        } catch {
            //
        }
    }, []);

    return {
        isPromptOpen,
        isBreakActive,
        isPostponeScheduled,
        accept,
        deny,
        postpone,
        finishBreak,
    };
}
