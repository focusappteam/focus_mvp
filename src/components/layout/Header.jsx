import styles from "./layout.module.css";
import { useTimer } from "../../contexts/TimerContext";
import { useBoard } from "../../contexts/BoardContext";
import FocusButton from "../../features/focusMode/components/FocusButton";
import { useMemo } from "react";
import { useTaskTimer } from "../../features/focusMode/hooks/useTaskTimer";
import { Menu } from "lucide-react";

function Header({ onEnterFocus, onToggleSidebar, sidebarOpen }) {
    const { state } = useTimer();
    const { allTasks } = useBoard();



    // Now reads from context instead of localStorage directly
    const activeTask = useMemo(() =>
        state.taskId ? allTasks.find(t => t.id === state.taskId) ?? null : null,
        [state.taskId, allTasks]
    );

    const { formattedTime, isStopwatch, isRunning } = useTaskTimer(activeTask);
    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <button
                    className={`${styles.hamburger} ${sidebarOpen ? styles.hamburgerActive : ""}`}
                    onClick={onToggleSidebar}
                    title={sidebarOpen ? "Cerrar sidebar" : "Abrir sidebar"}
                >
                    <Menu size={18} />
                </button>
                <div className={styles.logo}>
                    <span className={styles.logoPrimary}>FOCUS</span>
                    <span className={styles.logoSecondary}>.app</span>
                </div>
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

            <input className={styles.search} placeholder="Buscar tareas..." />
            <div className={styles.userAvatar}>R</div>
        </header>
    );
}

export default Header;