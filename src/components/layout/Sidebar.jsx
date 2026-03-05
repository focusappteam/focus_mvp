import { useState } from "react";
import styles from "./layout.module.css";
import { LayoutGrid, Plus } from "lucide-react";

function Sidebar() {
    const [workspaces, setWorkspaces] = useState(() => {
        const saved = localStorage.getItem("workspaces");
        return saved ? JSON.parse(saved) : [];
    });
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");

    function handleCreate() {
        const trimmed = newName.trim();
        if (!trimmed) { setIsCreating(false); return; }
        const updated = [...workspaces, { id: `ws-${Date.now()}`, name: trimmed }];
        setWorkspaces(updated);
        localStorage.setItem("workspaces", JSON.stringify(updated));
        setNewName("");
        setIsCreating(false);
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") handleCreate();
        if (e.key === "Escape") { setIsCreating(false); setNewName(""); }
    }

    return (
        <aside className={styles.sidebar}>
            <p className={styles.sidebarTitle}>Workspaces</p>

            <ul className={styles.navList}>
                {workspaces.map(ws => (
                    <li key={ws.id} className={styles.navItem}>
                        <span className={styles.navIcon}><LayoutGrid size={15} /></span>
                        <span className={styles.navLabel}>{ws.name}</span>
                    </li>
                ))}
            </ul>

            {isCreating ? (
                <div className={styles.createInputWrapper}>
                    <input
                        autoFocus
                        className={styles.createInput}
                        placeholder="Nombre del workspace..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleCreate}
                    />
                </div>
            ) : (
                <button className={styles.createButton} onClick={() => setIsCreating(true)}>
                    <Plus size={14} />
                    Crear nuevo
                </button>
            )}
        </aside>
    );
}

export default Sidebar;