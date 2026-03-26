import { useState, useEffect, useRef } from "react";
import StatsOverlay from "../../features/board/components/StatsOverlay";
import styles from "./layout.module.css";
import { LayoutGrid, Plus, GripVertical, BarChart2 } from "lucide-react";
import { useBoard } from "../../contexts/BoardContext";
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

// ---------- Context Menu ----------
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
        <div ref={ref} className={styles.contextMenu} style={{ top: y, left: x }}>
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

// ---------- Sortable Item ----------
function SortableWorkspaceItem({ ws, isActive, isRenaming, onContextMenu, onRenameSubmit, onRenameCancel, onSelect }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ws.id });

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
            className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            onClick={() => !isRenaming && onSelect(ws.id)}
            onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, ws.id); }}
        >
            <span className={styles.dragHandle} {...attributes} {...listeners}>
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

// ---------- Sidebar ----------
function Sidebar({ blocked = false }) {
    const {
        workspaces,
        activeWorkspaceId,
        createWorkspace,
        renameWorkspace,
        deleteWorkspace,
        reorderWorkspaces,
        selectWorkspace,
    } = useBoard();

    const [showStats, setShowStats] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [contextMenu, setContextMenu] = useState(null);
    const [renamingId, setRenamingId] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
    );

    async function handleCreate() {
        const trimmed = newName.trim();
        if (!trimmed) { setIsCreating(false); return; }
        const newWs = await createWorkspace(trimmed);
        if (newWs?.id) selectWorkspace(newWs.id);
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

    function handleRenameSubmit(value) {
        renameWorkspace(renamingId, value);
        setRenamingId(null);
    }

    function handleDelete(wsId) {
        deleteWorkspace(wsId);
        setContextMenu(null);
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = workspaces.findIndex(ws => ws.id === active.id);
        const newIndex = workspaces.findIndex(ws => ws.id === over.id);
        reorderWorkspaces(arrayMove(workspaces, oldIndex, newIndex));
    }

    return (
        <aside className={styles.sidebar}>
            {blocked && (
                <div
                    className={styles.sidebarBlockedOverlay}
                    title="No puedes cambiar de workspace durante una sesión activa"
                />
            )}
        <p className={styles.sidebarTitle}>Workspaces</p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={workspaces.map((ws) => ws.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className={styles.navList}>
              {workspaces.map((ws) => (
                <SortableWorkspaceItem
                  key={ws.id}
                  ws={ws}
                  isActive={ws.id === activeWorkspaceId}
                  isRenaming={renamingId === ws.id}
                  onContextMenu={handleContextMenu}
                  onRenameSubmit={handleRenameSubmit}
                  onRenameCancel={() => setRenamingId(null)}
                  onSelect={selectWorkspace}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

            {isCreating ? (
                <div className={styles.createInputWrapper}>
                    <input
                        id="nombrewks"
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

            <button className={styles.statsButton} onClick={() => setShowStats(true)}>
                <BarChart2 size={14} /> Estadisticas
            </button>

            {showStats && <StatsOverlay onClose={() => setShowStats(false)} />}
        </aside>
    );
}

export default Sidebar;