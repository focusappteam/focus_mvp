import styles from "./layout.module.css";

function Sidebar() {
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
        </aside>
    );
}

export default Sidebar;
