import styles from "./layout.module.css";
import { useTimer } from "../../contexts/TimerContext";
import { useBoard } from "../../contexts/BoardContext";
import FocusButton from "../../features/focusMode/components/FocusButton";
import { useMemo } from "react";
import { useTaskTimer } from "../../features/focusMode/hooks/useTaskTimer";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function Header({ onEnterFocus, onToggleSidebar, sidebarOpen }) {
    const { state } = useTimer();
    const { allTasks } = useBoard();
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();


    // Now reads from context instead of localStorage directly
    const activeTask = useMemo(() =>
        state.taskId ? allTasks.find(t => t.id === state.taskId) ?? null : null,
        [state.taskId, allTasks]
    );

    const { formattedTime, isStopwatch, isRunning } = useTaskTimer(activeTask);

    async function handleSignOut() {
        await signOut();
        navigate("/login", { replace: true });
    }
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
            <div className={styles.userSection}>

                {/* Nombre o email del usuario */}
                <span className={styles.userName}>
                    {profile?.full_name ?? user?.email}
                </span>

                {/* Botón de logout con ícono */}
                <button
                    onClick={handleSignOut}
                    className={styles.logoutButton}
                    title="Cerrar sesión"
                >
                    <LogOut size={16} />
                </button>

            </div>

        </header>
    );
}

export default Header;