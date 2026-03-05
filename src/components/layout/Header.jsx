import { useState, useMemo } from "react";
import styles from "./layout.module.css";
import { useTimer } from "../../contexts/TimerContext";
import FocusButton from "../../features/board/focus/FocusButton";

function Header({ onEnterFocus }) {
    const { state, POMODORO_DURATION } = useTimer();

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const activeTask = useMemo(() => {
        if (!state.taskId) return null;
        const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
        return tasks.find(t => t.id === state.taskId) ?? null;
    }, [state.taskId]);

    const activeTimer = state.taskId && state.timers[state.taskId];
    const isStopwatch = activeTimer?.mode === 'stopwatch';
    const currentTime = isStopwatch
        ? activeTimer.elapsedTime || 0
        : activeTimer?.remainingTime ?? POMODORO_DURATION;

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <span className={styles.logoPrimary}>FOCUS</span>
                <span className={styles.logoSecondary}>.app</span>
            </div>

            <div className={styles.headerCenter}>
                {activeTimer && (
                    <>
                        <div className={styles.timerBadge}>{formatTime(currentTime)}</div>
                        <div className={styles.focusBadge}>{isStopwatch ? 'STOPWATCH' : 'CountDown'}</div>
                    </>
                )}
                {activeTask && (
                    <FocusButton
                        activeTask={activeTask}
                        onEnterFocus={onEnterFocus}
                    />
                )}
            </div>

            <input
                className={styles.search}
                placeholder="Buscar tareas..."
            />

            <div className={styles.userAvatar}>R</div>
        </header>
    );
}

export default Header;