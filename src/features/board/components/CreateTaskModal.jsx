import styles from "./createTaskModal.module.css";
import { useState, useRef, useEffect } from "react";

function Dropdown({ value, options, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div className={styles.dropdown} ref={ref}>
            <button
                type="button"
                className={`${styles.dropdownTrigger} ${open ? styles.open : ""}`}
                onClick={() => setOpen(!open)}
            >
                {value}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            {open && (
                <div className={styles.dropdownMenu}>
                    {options.map(opt => (
                        <button
                            key={opt}
                            type="button"
                            className={`${styles.dropdownOption} ${value === opt ? styles.selected : ""}`}
                            onClick={() => { onChange(opt); setOpen(false); }}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function CreateTaskModal({ onClose, onCreate, position }) {

    const [form, setForm] = useState({
        title: "",
        description: "",
        color: "",
        priority: "Medium",
        dueDate: ""
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
            dueDate: form.dueDate || null,
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
                            maxLength={25}
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
                        <Dropdown
                            value={form.priority}
                            options={["Low", "Medium", "High"]}
                            onChange={val => setForm(f => ({ ...f, priority: val }))}
                        />
                    </div>

                    <div className={styles.field}>
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                        />
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