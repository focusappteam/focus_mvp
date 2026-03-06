import { useState, useEffect, useRef } from "react";
import styles from "./layout.module.css";
import { LayoutGrid, Plus, GripVertical } from "lucide-react";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function ContextMenu({ x, y, onRename, onDelete, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        }
        function handleKey(e) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleKey);
        };
    }, [onClose]);

    return (
        <div
            ref={ref}
            className={styles.contextMenu}
            style={{ top: y, left: x }}
        >
            <button className={styles.contextMenuItem} onClick={onRename}>
                Renombrar
            </button>
            <div className={styles.contextMenuDivider} />
            <button className={`${styles.contextMenuItem} ${styles.contextMenuItemDanger}`} onClick={onDelete}>
                Eliminar
            </button>
        </div>
    );
}

function SortableWorkspaceItem({ ws, isRenaming, onContextMenu, onRenameSubmit, onRenameCancel }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: ws.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : "auto",
    };

    const inputRef = useRef(null);
    const [renameValue, setRenameValue] = useState(ws.name);

    useEffect(() => {
        if (isRenaming) {
            setRenameValue(ws.name);
            setTimeout(() => inputRef.current?.select(), 0);
        }
    }, [isRenaming, ws.name]);

    function handleKeyDown(e) {
        if (e.key === "Enter") onRenameSubmit(renameValue);
        if (e.key === "Escape") onRenameCancel();
    }

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={styles.navItem}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(e, ws.id);
            }}
        >
            <span
                className={styles.dragHandle}
                {...attributes}
                {...listeners}
            >
                <GripVertical size={13} />
            </span>

            <span className={styles.navIcon}><LayoutGrid size={14} /></span>

            {isRenaming ? (
                <input
                    ref={inputRef}
                    className={styles.renameInput}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => onRenameSubmit(renameValue)}
                    onClick={e => e.stopPropagation()}
                />
            ) : (
                <span className={styles.navLabel}>{ws.name}</span>
            )}
        </li>
    );
}

function Sidebar() {
    const [workspaces, setWorkspaces] = useState(() => {
        const saved = localStorage.getItem("workspaces");
        return saved ? JSON.parse(saved) : [];
    });
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [renamingId, setRenamingId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    function save(updated) {
        setWorkspaces(updated);
        localStorage.setItem("workspaces", JSON.stringify(updated));
    }

    function handleCreate() {
        const trimmed = newName.trim();
        if (!trimmed) { setIsCreating(false); return; }
        const updated = [...workspaces, { id: `ws-${Date.now()}`, name: trimmed }];
        save(updated);
        setNewName("");
        setIsCreating(false);
    }

    function handleCreateKeyDown(e) {
        if (e.key === "Enter") handleCreate();
        if (e.key === "Escape") { setIsCreating(false); setNewName(""); }
    }

    function handleContextMenu(e, wsId) {
        setContextMenu({ x: e.clientX, y: e.clientY, wsId });
    }

    function handleRename(value) {
        const trimmed = value.trim();
        if (trimmed) {
            save(workspaces.map(ws => ws.id === renamingId ? { ...ws, name: trimmed } : ws));
        }
        setRenamingId(null);
    }

    function handleDelete(wsId) {
        save(workspaces.filter(ws => ws.id !== wsId));
        setContextMenu(null);
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = workspaces.findIndex(ws => ws.id === active.id);
        const newIndex = workspaces.findIndex(ws => ws.id === over.id);
        save(arrayMove(workspaces, oldIndex, newIndex));
    }

    return (
        <aside className={styles.sidebar}>
            <p className={styles.sidebarTitle}>Workspaces</p>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={workspaces.map(ws => ws.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ul className={styles.navList}>
                        {workspaces.map(ws => (
                            <SortableWorkspaceItem
                                key={ws.id}
                                ws={ws}
                                isRenaming={renamingId === ws.id}
                                onContextMenu={handleContextMenu}
                                onRenameSubmit={handleRename}
                                onRenameCancel={() => setRenamingId(null)}
                            />
                        ))}
                    </ul>
                </SortableContext>
            </DndContext>

            {isCreating ? (
                <div className={styles.createInputWrapper}>
                    <input
                        autoFocus
                        className={styles.createInput}
                        placeholder="Nombre del workspace..."
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={handleCreateKeyDown}
                        onBlur={handleCreate}
                    />
                </div>
            ) : (
                <button className={styles.createButton} onClick={() => setIsCreating(true)}>
                    <Plus size={14} />
                    Crear nuevo
                </button>
            )}

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onRename={() => {
                        setRenamingId(contextMenu.wsId);
                        setContextMenu(null);
                    }}
                    onDelete={() => handleDelete(contextMenu.wsId)}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </aside>
    );
}

export default Sidebar;