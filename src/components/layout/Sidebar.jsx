import { useState } from "react";
import styles from "./layout.module.css";
import StatsOverlay from "../../features/board/statistics/statsOverlay";

function Sidebar() {
    const [showStats, setShowStats] = useState(false);

    return (
        <aside className={styles.sidebar}>
            <h4 className={styles.sidebarTitle}>Workspaces</h4>

            <ul className={styles.navList}>
                <li className={`${styles.navItem} ${styles.active}`}>Design System</li>
                <li className={styles.navItem}>Personal</li>
                <li className={styles.navItem}>Startup</li>
            </ul>

            <button className={styles.createButton}>
                + Crear nueva
            </button>

            <button
                className={styles.statsButton}
                onClick={() => setShowStats(true)}
            >
             Statistics
            </button>

            {showStats && (
                <StatsOverlay onClose={() => setShowStats(false)} />
            )}
        </aside>
    );
}

export default Sidebar;