import styles from "./createTaskModal.module.css";
import { useState } from "react";


function CreateTaskModal({ onClose, onCreate, position }) {
    
    const [form, setForm] = useState({
        title: "",
        description: "",
        color: ""
    });


    function handleSubmit(e) {
        e.preventDefault();

        if (!form.title.trim()) return;

        const newTask = {
            id: crypto.randomUUID(),
            title: form.title,
            description: form.description,
            status: "todo",
            category: "General",
            priority: "Medium",
            createdAt: new Date().toISOString(),
            time: 0,
            timeActive: 0,
            style: { color: form.color },
            position: position || { x: 100, y: 100 },
            checklist: [],
            tags: []
        };

        onCreate(newTask);
        onClose();
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
