import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTaskTimer } from './useTaskTimer';
import { useTimer } from '../../../contexts/TimerContext';

export function useFocusMode(activeTask) {
    const { state } = useTimer();

    // Consume la capa base
    const {
        isRunning,
        isStopwatch,
        formattedTime,
        handleStart,
        handlePause,
        handleReset,
    } = useTaskTimer(activeTask);

    // ── isFocusActive: para FocusButton ──────────────────────
    // Sabe si HAY ALGUNA tarea en sesión activa (no solo activeTask)
    const isFocusActive = !!(
        state.taskId && state.timers[state.taskId]?.isRunning
    );

    // ── Break (exclusivo del overlay) ────────────────────────
    const [isBreak, setIsBreak] = useState(false);
    const [breakSeconds, setBreakSeconds] = useState(5 * 60);

    useEffect(() => {
        if (!isBreak) return;
        const interval = setInterval(() => {
            setBreakSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsBreak(false);
                    return 5 * 60;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [isBreak]);

    const breakFormattedTime = useMemo(() => {
        const mm = String(Math.floor(breakSeconds / 60)).padStart(2, '0');
        const ss = String(breakSeconds % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    }, [breakSeconds]);

    // ── Handlers del overlay ──────────────────────────────────
    const handlePauseResume = useCallback(() => {
        if (isRunning) {
            handlePause();
        } else {
            handleStart();
        }
    }, [isRunning, handlePause, handleStart]);

    const handleBreak = useCallback(() => {
        if (isRunning) handlePause();
        setIsBreak(true);
        setBreakSeconds(5 * 60);
    }, [isRunning, handlePause]);

    const handleBackToFocus = useCallback(() => {
        setIsBreak(false);
        handleStart();
    }, [handleStart]);

    return {
        // Del overlay
        isRunning,
        isStopwatch,
        isBreak,
        isFocusActive,
        formattedTime,       // tiempo del timer/stopwatch
        breakFormattedTime,  // tiempo del break
        // Handlers del overlay
        handlePauseResume,
        handleBreak,
        handleBackToFocus,
        handleReset,
    };
}
