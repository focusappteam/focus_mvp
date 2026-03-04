import styles from './toast.module.css';

function Toast({ message, visible }) {
    if (!message) return null;
    return (
        <div className={`${styles.toast} ${visible ? styles.toastEnter : styles.toastExit}`}>
            {message}
        </div>
    );
}

export default Toast;
