import styles from "./layout.module.css";
import { useTimer } from "../../contexts/TimerContext";

function Header() {
    const { state } = useTimer();

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <span className={styles.logoPrimary}>FOCUS</span>
                <span className={styles.logoSecondary}>.app</span>
            </div>

            <div className={styles.headerCenter}>
                <div className={styles.timerBadge}>{formatTime(state.remainingTime)}</div>
                <div className={styles.focusBadge}>FOCUS</div>
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
