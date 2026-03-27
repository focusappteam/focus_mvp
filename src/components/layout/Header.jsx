import styles from "./layout.module.css";
import { useTimer } from "../../contexts/TimerContext";
import { useBoard } from "../../contexts/BoardContext";
import FocusButton from "../../features/focusMode/components/FocusButton";
import { useMemo, useState } from "react";
import { useTaskTimer } from "../../features/focusMode/hooks/useTaskTimer";
import { Menu, LogOut, HelpCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useOnboardingRef, useOnboarding } from "../../hooks/useOnboarding";

function Header({ onEnterFocus, onToggleSidebar, sidebarOpen }) {
    const { state } = useTimer();
    const { allTasks } = useBoard();
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isSigningOut, setIsSigningOut] = useState(false);

    // Callback ref para el botón de focus
    const focusBtnRef = useOnboardingRef("focus-mode-btn");
    const { isCompleted: onboardingCompleted, reset: resetOnboarding } = useOnboarding();

    const activeTask = useMemo(
        () => state.taskId ? allTasks.find(t => t.id === state.taskId) ?? null : null,
        [state.taskId, allTasks]
    );
    const { formattedTime, isStopwatch, isRunning } = useTaskTimer(activeTask);

    async function handleSignOut() {
        if (isSigningOut) return;
        setIsSigningOut(true);
        try {
            const { error } = await signOut();
            if (error) console.error("Sign-out completed with warning:", error);
            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Sign-out handler failed:", error);
            navigate("/login", { replace: true });
        } finally {
            setIsSigningOut(false);
        }
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
                        <div className={styles.focusBadge}>{isStopwatch ? "STOPWATCH" : "CountDown"}</div>
                        {activeTask && (
                            /*
                                El callback ref va en el span wrapper porque FocusButton
                                es un componente propio y no acepta refs directamente
                                (no usa forwardRef). El span es invisible para el layout.
                            */
                            <span ref={focusBtnRef} style={{ display: "contents" }}>
                                <FocusButton activeTask={activeTask} onEnterFocus={onEnterFocus} />
                            </span>
                        )}
                    </>
                )}
            </div>

            <input className={styles.search} placeholder="Buscar tareas..." />

            <div className={styles.userSection}>
                {/* Botón "?" visible solo después de completar el tutorial */}
                {onboardingCompleted && (
                    <button
                        type="button"
                        className={styles.tutorialButton}
                        onClick={resetOnboarding}
                        title="Ver tutorial de nuevo"
                        aria-label="Ver tutorial"
                    >
                        <HelpCircle size={15} />
                    </button>
                )}

                <span className={styles.userName}>
                    {profile?.full_name ?? user?.email}
                </span>

                <button
                    type="button"
                    onClick={handleSignOut}
                    className={styles.logoutButton}
                    title="Cerrar sesión"
                    disabled={isSigningOut}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
}

export default Header;