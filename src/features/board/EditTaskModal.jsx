import styles from "./createTaskModal.module.css";
import { useState, useEffect } from "react";

function EditTaskModal({ onClose, onSave, task }) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        color: "#4f46e5"
    });

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title,
                description: task.description || "",
                color: task.style?.color || "#4f46e5"
            });
        }
    }, [task]);

    function handleSubmit(e) {
        e.preventDefault();

        if (!form.title.trim()) return;

        const updatedTask = {
            ...task,
            title: form.title,
            description: form.description,
            style: { color: form.color }
        };

        onSave(updatedTask);
        onClose();
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2>Editar tarea</h2>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.field}>
                        <label>Título *</label>
                        <input
                            type="text"
                            placeholder="Ej: Estudiar React"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Descripción</label>
                        <textarea
                            placeholder="Opcional"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Color</label>
                        <input
                            type="color"
                            value={form.color}
                            onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit">Guardar cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditTaskModal;
