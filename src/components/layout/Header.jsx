import styles from "./layout.module.css";
import { useTimer } from "../../contexts/TimerContext";
import FocusButton from "../../features/focusMode/components/FocusButton";
import { useMemo } from "react";
import { useTaskTimer } from "../../features/focusMode/hooks/useTaskTimer";

function Header({ onEnterFocus }) {
    const { state } = useTimer();

    const activeTask = useMemo(() => {
        if (!state.taskId) return null;
        const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
        return tasks.find(t => t.id === state.taskId) ?? null;
    }, [state.taskId]);

    const { formattedTime, isStopwatch, isRunning } = useTaskTimer(activeTask);
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <span className={styles.logoPrimary}>FOCUS</span>
                <span className={styles.logoSecondary}>.app</span>
            </div>

            <div className={styles.headerCenter}>
                {isRunning && (
                    <>
                        <div className={styles.timerBadge}>{formattedTime}</div>
                        <div className={styles.focusBadge}>{isStopwatch ? 'STOPWATCH' : 'CountDown'}</div>
                        {activeTask && (
                            <FocusButton
                                activeTask={activeTask}
                                onEnterFocus={onEnterFocus}
                            />)}
                    </>
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