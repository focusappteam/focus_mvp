import styles from "./createTaskModal.module.css";

function CreateTaskModal({ onClose }) {
    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Nueva tarea</h2>

                <form className={styles.form}>
                    <div className={styles.field}>
                        <label>Título *</label>
                        <input type="text" placeholder="Ej: Estudiar React" />
                    </div>

                    <div className={styles.field}>
                        <label>Descripción</label>
                        <textarea placeholder="Opcional" />
                    </div>

                    <div className={styles.field}>
                        <label>Color</label>
                        <input type="color" />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateTaskModal;
