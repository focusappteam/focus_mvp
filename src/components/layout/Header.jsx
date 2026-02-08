import styles from "./layout.module.css";

function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                <span className={styles.logoPrimary}>FOCUS</span>
                <span className={styles.logoSecondary}>.app</span>
            </div>

            <div className={styles.headerCenter}>
                <div className={styles.timerBadge}>25:00</div>
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
