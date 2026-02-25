import styles from "./createTaskModal.module.css";
import { useState } from "react";


function CreateTaskModal({ onClose, onCreate, position }) {

    const [form, setForm] = useState({
        title: "",
        description: "",
        color: "",
        priority: "Medium"
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
            priority: form.priority,
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

                        <input
                            type="text"
                            placeholder="Titulo"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            required
                        />
                    </div>

                    <div className={styles.field}>

                        <textarea
                            placeholder="Descripción (Opcional)"
                            value={form.description}
                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <div className={styles.field}>
                        <select
                            value={form.priority}
                            onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.closeBtn} type="button" onClick={onClose}>
                            Cancelar
                        </button>
                        <button className={styles.createBtn} type="submit">Crear</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CreateTaskModal;
