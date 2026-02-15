import styles from "./createTaskModal.module.css";

function TaskModal({ open, onClose, children }) {
    if (!open) return null;
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {children}
                <button type="button" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
}

export default TaskModal;
