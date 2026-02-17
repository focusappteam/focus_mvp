import styles from "./editTaskModal.module.css";
import { useState, useEffect } from "react";
import { 
    FolderOpen, 
    X, 
    CheckSquare, 
    Check, 
    Brain, 
    Play, 
    RotateCcw, 
    Palette, 
    CheckCheck, 
    Trash2,
    Plus
} from "lucide-react";

const ACCENT_COLORS = [
    "#4a5e52",
    "#f59e0b",
    "#818cf8",
    "#f472b6",
    "#34d399"
];

function EditTaskModal({ onClose, onSave, onDelete, onComplete, task }) {
    const [form, setForm] = useState({
        title: "",
        description: "",
        color: "#4a5e52",
        category: "",
        priority: "Medium",
        checklist: [],
        tags: [],
        createdAt: ""
    });

    const [newChecklistItem, setNewChecklistItem] = useState("");
    const [isAddingChecklist, setIsAddingChecklist] = useState(false);
    const [newTag, setNewTag] = useState("");
    const [isAddingTag, setIsAddingTag] = useState(false);

    useEffect(() => {
        if (task) {
            setForm({
                title: task.title || "",
                description: task.description || "",
                color: task.style?.color || "#4a5e52",
                category: task.category || "General",
                priority: task.priority || "Medium",
                checklist: task.checklist || [],
                tags: task.tags || [],
                createdAt: task.createdAt || new Date().toISOString()
            });
        }
    }, [task]);

    function handleChecklistToggle(index) {
        const newChecklist = [...form.checklist];
        newChecklist[index] = {
            ...newChecklist[index],
            checked: !newChecklist[index].checked
        };
        setForm(f => ({ ...f, checklist: newChecklist }));
    }

    function handleRemoveChecklistItem(index, e) {
        e.stopPropagation();
        const newChecklist = form.checklist.filter((_, i) => i !== index);
        setForm(f => ({ ...f, checklist: newChecklist }));
    }

    function handleAddChecklistItem(e) {
        if (e.key === "Enter" && newChecklistItem.trim()) {
            e.preventDefault();
            setForm(f => ({
                ...f,
                checklist: [...f.checklist, { text: newChecklistItem.trim(), checked: false }]
            }));
            setNewChecklistItem("");
            setIsAddingChecklist(false);
        } else if (e.key === "Escape") {
            setNewChecklistItem("");
            setIsAddingChecklist(false);
        }
    }

    function handleAddTag(e) {
        if (e.key === "Enter" && newTag.trim()) {
            e.preventDefault();
            if (!form.tags.includes(newTag.trim().toUpperCase())) {
                setForm(f => ({
                    ...f,
                    tags: [...f.tags, newTag.trim().toUpperCase()]
                }));
            }
            setNewTag("");
            setIsAddingTag(false);
        } else if (e.key === "Escape") {
            setNewTag("");
            setIsAddingTag(false);
        }
    }

    function handleColorSelect(color) {
        setForm(f => ({ ...f, color }));
    }

    function handleClose() {
        // Save changes before closing
        const updatedTask = {
            ...task,
            title: form.title,
            description: form.description,
            category: form.category,
            priority: form.priority,
            checklist: form.checklist,
            tags: form.tags,
            style: { color: form.color }
        };
        onSave(updatedTask);
        onClose();
    }

    function handleComplete() {
        if (onComplete) {
            onComplete(task.id);
        }
        onClose();
    }

    function handleDelete() {
        if (onDelete) {
            onDelete(task.id);
        }
        onClose();
    }

    function getTagStyle(tag) {
        const upperTag = tag.toUpperCase();
        if (upperTag.includes("ENGINEERING") || upperTag.includes("DEV")) {
            return styles.tagEngineering;
        } else if (upperTag.includes("SECURITY")) {
            return styles.tagSecurity;
        } else if (upperTag.includes("PRIORITY") || upperTag.includes("HIGH") || upperTag.includes("URGENT")) {
            return styles.tagPriority;
        }
        return styles.tagDefault;
    }

    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Left Panel - Main Content */}
                <div className={styles.mainContent}>
                    <div className={styles.header}>
                        <div className={styles.category}>
                            <FolderOpen size={14} className={styles.categoryIcon} />
                            {form.category}
                        </div>
                        <button className={styles.closeButton} onClick={handleClose}>
                            <X size={20} />
                        </button>
                    </div>

                    <h1 className={styles.title}>{form.title}</h1>
                    
                    <div className={styles.meta}>
                        Created: {formatDate(form.createdAt)} • <span className={styles.priority}>Priority: {form.priority}</span>
                    </div>

                    <p className={styles.description}>
                        {form.description || "No description provided."}
                    </p>

                    {/* Checklist Section */}
                    <div className={styles.checklistSection}>
                        <div className={styles.sectionHeader}>
                            <CheckSquare size={14} className={styles.sectionIcon} />
                            PREPARATION CHECKLIST
                        </div>
                        <div className={styles.checklistItems}>
                            {form.checklist.map((item, index) => (
                                <div 
                                    key={index} 
                                    className={`${styles.checklistItem} ${item.checked ? styles.checked : ""}`}
                                    onClick={() => handleChecklistToggle(index)}
                                >
                                    <div className={`${styles.checkbox} ${item.checked ? styles.checked : ""}`}>
                                        {item.checked && <Check size={12} className={styles.checkmark} />}
                                    </div>
                                    <span className={styles.checklistText}>{item.text}</span>
                                    <button 
                                        className={styles.removeChecklistItem}
                                        onClick={(e) => handleRemoveChecklistItem(index, e)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            
                            {isAddingChecklist ? (
                                <div className={styles.checklistItem}>
                                    <div className={styles.checkbox}></div>
                                    <input
                                        type="text"
                                        className={styles.newChecklistInput}
                                        placeholder="Enter checklist item..."
                                        value={newChecklistItem}
                                        onChange={e => setNewChecklistItem(e.target.value)}
                                        onKeyDown={handleAddChecklistItem}
                                        onBlur={() => {
                                            if (!newChecklistItem.trim()) {
                                                setIsAddingChecklist(false);
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div 
                                    className={styles.addChecklistItem}
                                    onClick={() => setIsAddingChecklist(true)}
                                >
                                    <div className={styles.addIcon}><Plus size={14} /></div>
                                    <span className={styles.addText}>Add checklist item</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className={styles.tagsSection}>
                        {form.tags.map((tag, index) => (
                            <span key={index} className={`${styles.tag} ${getTagStyle(tag)}`}>
                                #{tag}
                            </span>
                        ))}
                        
                        {isAddingTag ? (
                            <input
                                type="text"
                                className={styles.tagInput}
                                placeholder="Tag name"
                                value={newTag}
                                onChange={e => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                onBlur={() => {
                                    if (!newTag.trim()) {
                                        setIsAddingTag(false);
                                    }
                                }}
                                autoFocus
                            />
                        ) : (
                            <button 
                                className={styles.addTagButton}
                                onClick={() => setIsAddingTag(true)}
                            >
                                <Plus size={12} /> Add Tag
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Panel - Sidebar */}
                <div className={styles.sidebar}>
                    {/* Timer Section */}
                    <div className={styles.timerSection}>
                        <div className={styles.timerLabel}>
                            <Brain size={14} className={styles.timerIcon} />
                            DEEP WORK
                        </div>
                        <div className={styles.timerCircle}>
                            <span className={styles.timerTime}>25:00</span>
                            <span className={styles.timerSubtext}>FOCUS SESSION</span>
                        </div>
                        <div className={styles.timerControls}>
                            <button className={styles.startButton}>
                                <Play size={12} className={styles.playIcon} />
                                Start
                            </button>
                            <button className={styles.resetButton}><RotateCcw size={16} /></button>
                        </div>
                    </div>

                    {/* Card Accent Section */}
                    <div className={styles.accentSection}>
                        <div className={styles.accentLabel}>
                            <Palette size={14} className={styles.accentIcon} />
                            CARD ACCENT
                        </div>
                        <div className={styles.colorPicker}>
                            {ACCENT_COLORS.map((color) => (
                                <div
                                    key={color}
                                    className={`${styles.colorOption} ${form.color === color ? styles.selected : ""}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleColorSelect(color)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Actions Section */}
                    <div className={styles.actionsSection}>
                        <button className={styles.completeButton} onClick={handleComplete}>
                            Mark as Complete
                            <CheckCheck size={18} className={styles.completeIcon} />
                        </button>
                        <button className={styles.deleteButton} onClick={handleDelete}>
                            Delete Task
                            <Trash2 size={16} className={styles.deleteIcon} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditTaskModal;
