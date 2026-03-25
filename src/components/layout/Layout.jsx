import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./layout.module.css";
import { useTimer } from "../../contexts/TimerContext";

function Layout({ children, onEnterFocus, sidebarOpen, onToggleSidebar }) {
    const { state } = useTimer();
    const isSidebarBlocked = !!(
        state.taskId && state.timers[state.taskId]?.isRunning
    );

    return (
        <div className={styles.app}>
            <Header onEnterFocus={onEnterFocus} onToggleSidebar={onToggleSidebar} sidebarOpen={sidebarOpen} />
            <div className={styles.body}>
                <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.sidebarWrapperOpen : ""}`}>
                    <Sidebar blocked={isSidebarBlocked} />
                </div>
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;