import { useState, useRef, useEffect, useCallback } from "react";
import { STRETCHES, STRETCH_TOTAL_CAP_SECONDS } from "../config/stretches";

/**
 * Drives the sequence of stretches shown in <StretchWindow />.
 *
 * The stretching clock is intentionally independent of the deep-work
 * timer — once the modal opens, its own countdown runs regardless of
 * what the task timer is doing. Auto-advances per stretch and
 * auto-finishes at the total cap or on the last stretch.
 */
export function useStretches() {
    const [index, setIndex] = useState(0);
    const [secondsLeft, setSecondsLeft] = useState(
        STRETCHES[0]?.durationSeconds ?? 30
    );
    const [isFinished, setIsFinished] = useState(false);
    const [totalElapsed, setTotalElapsed] = useState(0);

    const intervalRef = useRef(null);

    const finishNow = useCallback(() => {
        setIsFinished(true);
        setSecondsLeft(0);
    }, []);

    const advance = useCallback(() => {
        setIndex(prev => {
            const next = prev + 1;
            if (next >= STRETCHES.length) {
                finishNow();
                return prev;
            }
            setSecondsLeft(STRETCHES[next].durationSeconds);
            return next;
        });
    }, [finishNow]);

    useEffect(() => {
        if (isFinished) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }
        intervalRef.current = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    advance();
                    return 0;
                }
                return prev - 1;
            });
            setTotalElapsed(prev => {
                const next = prev + 1;
                if (next >= STRETCH_TOTAL_CAP_SECONDS) {
                    finishNow();
                }
                return next;
            });
        }, 1000);
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isFinished, advance, finishNow]);

    useEffect(() => () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    const next = useCallback(() => {
        if (isFinished) return;
        const nextIdx = index + 1;
        if (nextIdx >= STRETCHES.length) {
            finishNow();
        } else {
            setIndex(nextIdx);
            setSecondsLeft(STRETCHES[nextIdx].durationSeconds);
        }
    }, [index, isFinished, finishNow]);

    const finishEarly = useCallback(() => {
        finishNow();
    }, [finishNow]);

    const currentStretch = STRETCHES[Math.min(index, STRETCHES.length - 1)];
    const total = STRETCHES.length;
    const isLast = index >= STRETCHES.length - 1;
    const totalSecondsRemaining = Math.max(0, STRETCH_TOTAL_CAP_SECONDS - totalElapsed);

    return {
        currentStretch,
        index,
        total,
        isLast,
        isFinished,
        secondsLeft,
        totalSecondsRemaining,
        next,
        finishEarly,
    };
}
