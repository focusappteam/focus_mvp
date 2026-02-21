import styles from "./editTaskModal.module.css";
import { useState, useEffect, useRef } from "react";
import {
    FolderOpen,
    X,
    CheckSquare,
    Check,
    Brain,
    Play,
    Pause,
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

const POMODORO_DURATION = 1500; // 25 minutes in seconds

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

    // Timer state
    const [timerState, setTimerState] = useState(() => {
        const savedTimer = localStorage.getItem("globalTimer");
        if (savedTimer) {
            const parsed = JSON.parse(savedTimer);
            // Calculate remaining time if timer was running
            if (parsed.isRunning && parsed.startedAt) {
                const elapsed = Math.floor((Date.now() - parsed.startedAt) / 1000);
                const remaining = Math.max(0, parsed.remainingTime - elapsed);
                return { ...parsed, remainingTime: remaining };
            }
            return parsed;
        }
        return { taskId: null, remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null };
    });

    const intervalRef = useRef(null);

    // Check if this task owns the timer
    const isThisTaskTimer = timerState.taskId === task?.id;
    const canStartTimer = !timerState.isRunning || isThisTaskTimer;

    // Timer countdown effect
    useEffect(() => {
        if (timerState.isRunning && isThisTaskTimer) {
            intervalRef.current = setInterval(() => {
                setTimerState(prev => {
                    const newRemaining = prev.remainingTime - 1;

                    if (newRemaining <= 0) {
                        // Timer completed
                        clearInterval(intervalRef.current);

                        // Update task's timeActive
                        const updatedTask = {
                            ...task,
                            timeActive: (task.timeActive || 0) + POMODORO_DURATION
                        };
                        onSave(updatedTask);

                        // Reset timer state
                        const newState = { taskId: null, remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null };
                        localStorage.setItem("globalTimer", JSON.stringify(newState));

                        // Play notification sound or alert
                        if (Notification.permission === "granted") {
                            new Notification("Focus Session Complete!", { body: `Great work on "${task.title}"!` });
                        }

                        return newState;
                    }

                    return { ...prev, remainingTime: newRemaining };
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [timerState.isRunning, isThisTaskTimer, task, onSave]);

    // Persist timer state to localStorage
    useEffect(() => {
        localStorage.setItem("globalTimer", JSON.stringify(timerState));
    }, [timerState]);

    // Request notification permission
    useEffect(() => {
        if (Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    function handleStartTimer() {
        if (!canStartTimer) return;

        setTimerState(prev => ({
            taskId: task.id,
            remainingTime: prev.taskId === task.id ? prev.remainingTime : POMODORO_DURATION,
            isRunning: true,
            startedAt: Date.now()
        }));
    }

    function handlePauseTimer() {
        if (!isThisTaskTimer) return;

        // Calculate elapsed time to add to timeActive
        const elapsedSinceStart = timerState.startedAt
            ? Math.floor((Date.now() - timerState.startedAt) / 1000)
            : 0;

        // Update task's timeActive with the time worked so far
        if (elapsedSinceStart > 0) {
            const updatedTask = {
                ...task,
                timeActive: (task.timeActive || 0) + elapsedSinceStart
            };
            onSave(updatedTask);
        }

        setTimerState(prev => ({
            ...prev,
            isRunning: false,
            startedAt: null
        }));
    }

    function handleResetTimer() {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        setTimerState({
            taskId: null,
            remainingTime: POMODORO_DURATION,
            isRunning: false,
            startedAt: null
        });
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Calculate progress for the timer circle
    const timerProgress = isThisTaskTimer
        ? ((POMODORO_DURATION - timerState.remainingTime) / POMODORO_DURATION) * 100
        : 0;

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
        // Reset timer state completely before deleting task
        const cleanTimerState = { taskId: null, remainingTime: POMODORO_DURATION, isRunning: false, startedAt: null };
        setTimerState(cleanTimerState);
        localStorage.setItem("globalTimer", JSON.stringify(cleanTimerState));

        if (onDelete) {
            onDelete(task.id);
        }
        onClose();
    }

    function formatDate(dateString) {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
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
                            <span key={index} className={`${styles.tag}`}>
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
                        <div
                            className={`${styles.timerCircle} ${timerState.isRunning && isThisTaskTimer ? styles.timerActive : ""}`}
                            style={{ '--progress': `${timerProgress}%` }}
                        >
                            <span className={styles.timerTime}>
                                {isThisTaskTimer ? formatTime(timerState.remainingTime) : formatTime(POMODORO_DURATION)}
                            </span>
                            <span className={styles.timerSubtext}>FOCUS SESSION</span>
                        </div>
                        <div className={styles.timerControls}>
                            {timerState.isRunning && isThisTaskTimer ? (
                                <button className={styles.pauseButton} onClick={handlePauseTimer}>
                                    <Pause size={12} className={styles.playIcon} />
                                    Pause
                                </button>
                            ) : (
                                <button
                                    className={`${styles.startButton} ${!canStartTimer ? styles.disabled : ""}`}
                                    onClick={handleStartTimer}
                                    disabled={!canStartTimer}
                                >
                                    <Play size={12} className={styles.playIcon} />
                                    {isThisTaskTimer && timerState.remainingTime < POMODORO_DURATION ? "Resume" : "Start"}
                                </button>
                            )}
                            <button
                                className={styles.resetButton}
                                onClick={handleResetTimer}
                                disabled={!isThisTaskTimer && timerState.taskId !== null}
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>
                        {timerState.isRunning && !isThisTaskTimer && (
                            <div className={styles.timerWarning}>
                                Timer active on another task
                            </div>
                        )}
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
