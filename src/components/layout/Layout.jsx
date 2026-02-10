import Header from "./Header";
import styles from "./layout.module.css";

function Layout({ children }) {
    return (
        <div className={styles.app}>
            <Header />
            <div className={styles.body}>
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
}

export default Layout;
