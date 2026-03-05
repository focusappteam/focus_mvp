import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./layout.module.css";

function Layout({ children, onEnterFocus, sidebarOpen, onToggleSidebar }) {
    return (
        <div className={styles.app}>
            <Header onEnterFocus={onEnterFocus} onToggleSidebar={onToggleSidebar} sidebarOpen={sidebarOpen} />
            <div className={styles.body}>
                <div className={`${styles.sidebarWrapper} ${sidebarOpen ? styles.sidebarWrapperOpen : ""}`}>
                    <Sidebar />
                </div>
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;