import Header from "./Header";
import Sidebar from "./Sidebar";
import styles from "./layout.module.css";

function Layout({ children, onEnterFocus }) {
    return (
        <div className={styles.app}>
            <Header onEnterFocus={onEnterFocus} />
            <div className={styles.body}>
                <Sidebar />
                <main className={styles.main}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;