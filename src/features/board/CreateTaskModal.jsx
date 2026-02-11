import styles from "./createTaskModal.module.css";
import { useState } from "react";


function CreateTaskModal({ onClose, onCreate }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState("#4f46e5");

    function handleSubmit(e) {
        e.preventDefault();

        if (!title.trim()) return;

        const newTask = {
            id: crypto.randomUUID(),
            title,
            description,
            status: "todo",
            createdAt: new Date().toISOString(),
            time: 0,
            timeActive: 0,
            style: { color },
            position: {
                x: 100,
                y: 100
            }
        };


        onCreate(newTask)
        onClose()
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Nueva tarea</h2>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label>Título *</label>
                        <input
                            type="text"
                            placeholder="Ej: Estudiar React"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Descripción</label>
                        <textarea
                            placeholder="Opcional"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Color</label>
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                        />
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
