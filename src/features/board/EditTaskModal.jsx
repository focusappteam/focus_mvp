import styles from "./editTaskModal.module.css";
import { useState, useEffect } from "react";
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
  Plus,
  Timer,
  Clock
} from "lucide-react";
import { useTimer } from "../../contexts/TimerContext";

const ACCENT_COLORS = [
  "#4a5e52",
  "#f59e0b",
  "#818cf8",
  "#f472b6",
  "#34d399"
];

// duration now comes from context

function EditTaskModal({ onClose, onSave, onDelete, onComplete, task, showToast }) {
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

  // Timer state is stored in a global context
  const { state: timerState, start, pause, reset, toggleMode, POMODORO_DURATION } = useTimer();

  // Check if this task owns the timer and whether we can start
  const isThisTaskTimer = timerState.taskId === task?.id;
  const isThisTaskRunning = isThisTaskTimer && timerState.timers[task?.id]?.isRunning;
  const canStartTimer = !isThisTaskRunning || isThisTaskTimer;

  // Get current mode for this task (default to 'timer')
  const currentMode = timerState.timers[task?.id]?.mode || 'timer';
  const isStopwatch = currentMode === 'stopwatch';

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  function handleStartTimer() {
    if (!canStartTimer) return;

    start(task.id, () => {
      // timer finished callback
      const updatedTask = {
        ...task,
        timeActive: (task.timeActive || 0) + POMODORO_DURATION
      };
      onSave(updatedTask);
    }, task.title);
  }

  function handlePauseTimer() {
    if (!isThisTaskTimer) return;

    const taskTimer = timerState.timers[task?.id];
    const elapsedSinceStart = taskTimer?.startedAt
      ? Math.floor((Date.now() - taskTimer.startedAt) / 1000)
      : 0;

    if (elapsedSinceStart > 0) {
      const updatedTask = {
        ...task,
        timeActive: (task.timeActive || 0) + elapsedSinceStart
      };
      onSave(updatedTask);
    }

    pause();
  }

  function handleResetTimer() {
    reset();
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Calculate progress for the timer circle
  const currentTaskTimer = timerState.timers[task?.id];
  const timerProgress = currentTaskTimer
    ? isStopwatch
      ? Math.min((currentTaskTimer.elapsedTime || 0) / POMODORO_DURATION * 100, 100)
      : ((POMODORO_DURATION - currentTaskTimer.remainingTime) / POMODORO_DURATION) * 100
    : 0;

  // Get display time based on mode - show stored time if available
  const getDisplayTime = () => {
    if (currentTaskTimer) {
      if (isStopwatch) {
        return formatTime(currentTaskTimer.elapsedTime || 0);
      }
      return formatTime(currentTaskTimer.remainingTime ?? POMODORO_DURATION);
    }
    return isStopwatch ? formatTime(0) : formatTime(POMODORO_DURATION);
  };

  function handleToggleMode() {
    if (isThisTaskRunning) return; // Don't toggle while running
    toggleMode(task.id);
  }

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

    if (!form.title.trim()) {
      showToast("El título no puede estar vacío.");
      return;
    }
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
    handlePauseTimer();
    if (onComplete) {
      onComplete(task.id);
    }
    onClose();
  }

  function handleDelete() {
    // clear any timer (especially if it's running for this task)
    if (isThisTaskTimer) {
      reset();
    }

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
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Left Panel - Main Content */}
        <div
          inert={task.status === "completed"}
          className={styles.mainContent}
        >
          <div className={styles.header}>
            <div className={styles.category}>
              <FolderOpen size={14} className={styles.categoryIcon} />
              {form.category}
            </div>
            <button className={styles.closeButton} onClick={handleClose}>
              <X size={20} />
            </button>
          </div>


          <div >

            <textarea required value={form.title}
              className={styles.titleTa}
              name="title" id="title"
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value.replace(/\n/g, "") }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.target.blur();
                }
              }} />
          </div>

          <div className={styles.meta}>
            Created: {formatDate(form.createdAt)} •{" "}
            <span className={styles[form.priority]}>
              Priority: {form.priority}
            </span>
          </div>

          <div className={styles.field}>
            <textarea name="description" id="description" placeholder="  No description provided." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />


          </div>
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
                  <div
                    className={`${styles.checkbox} ${item.checked ? styles.checked : ""}`}
                  >
                    {item.checked && (
                      <Check size={12} className={styles.checkmark} />
                    )}
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
                    onChange={(e) => setNewChecklistItem(e.target.value)}
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
                  <div className={styles.addIcon}>
                    <Plus size={14} />
                  </div>
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
                onChange={(e) => setNewTag(e.target.value)}
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
              className={`${styles.timerCircle} ${isThisTaskRunning ? styles.timerActive : ""}`}
              style={{ "--progress": `${timerProgress}%` }}
            >
              <span className={styles.timerTime}>{getDisplayTime()}</span>
              <span className={styles.timerSubtext}>
                {isStopwatch ? "STOPWATCH" : "FOCUS SESSION"}
              </span>
            </div>
            <div className={styles.timerControls}>
              {isThisTaskRunning ? (
                <button
                  className={styles.pauseButton}
                  onClick={handlePauseTimer}
                >
                  <Pause size={12} className={styles.playIcon} />
                  Pause
                </button>
              ) : (
                <button
                  className={`${styles.startButton} ${!canStartTimer ? styles.disabled : ""}`}
                  onClick={handleStartTimer}
                  disabled={!canStartTimer || task.status === "completed"}
                >
                  <Play size={12} className={styles.playIcon} />
                  {currentTaskTimer &&
                    (isStopwatch
                      ? currentTaskTimer.elapsedTime > 0
                      : currentTaskTimer.remainingTime < POMODORO_DURATION)
                    ? "Resume"
                    : "Start"}
                </button>
              )}
              <button
                className={styles.resetButton}
                onClick={handleResetTimer}
                disabled={
                  (!isThisTaskTimer && timerState.taskId !== null) ||
                  task.status === "completed"
                }
              >
                <RotateCcw size={16} />
              </button>
            </div>
            {/* Mode Toggle */}
            <div
              className={`${styles.modeToggleContainer} ${isThisTaskRunning || task.status === "completed" ? styles.disabled : ""}`}
            >
              <button
                className={`${styles.modeOption} ${!isStopwatch ? styles.active : ""}`}
                onClick={() => (!isStopwatch ? null : handleToggleMode())}
                disabled={isThisTaskRunning || task.status === "completed"}
              >
                <Timer size={14} />
                Countdown
              </button>
              <button
                className={`${styles.modeOption} ${isStopwatch ? styles.active : ""}`}
                onClick={() => (isStopwatch ? null : handleToggleMode())}
                disabled={isThisTaskRunning || task.status === "completed"}
              >
                <Clock size={14} />
                Stopwatch
              </button>
            </div>
            {timerState.taskId &&
              timerState.timers[timerState.taskId]?.isRunning &&
              !isThisTaskTimer && (
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
            <button
              className={styles.completeButton}
              onClick={handleComplete}
            >
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
