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
  Clock,
  Pencil
} from "lucide-react";
import { useTaskTimer } from "../../focusMode/hooks/useTaskTimer";
import { useToast } from "../../../hooks/useToast";
import Toast from "../../../components/UI/Toast";
import { useOnboarding } from "../../../hooks/useOnboarding";



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
  const {
    isRunning,
    isStopwatch,
    canStart,
    hasStarted,
    formattedTime,
    timerProgress,
    handleStart,
    handlePause,
    handleReset,
    handleToggleMode,
  } = useTaskTimer(task);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [editingChecklistIndex, setEditingChecklistIndex] = useState(null);
  const [editingChecklistValue, setEditingChecklistValue] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const { toast, toastVisible, showToast } = useToast();
  const [editingTagIndex, setEditingTagIndex] = useState(null);
  const [editingTagValue, setEditingTagValue] = useState("");
  const { setIsEditingTaskOpen } = useOnboarding();

  useEffect(() => {
    setIsEditingTaskOpen(true);

    return () => {
      setIsEditingTaskOpen(false);
    };
  }, [setIsEditingTaskOpen]);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  function handleStartTimer() {
    handleStart(() => {
      const updatedTask = { ...task, timeActive: (task.timeActive ?? 0) + 1500 };
      onSave(updatedTask);
      showToast("Sesion completada!");
    });
  }

  function handlePauseTimer() {
    handlePause((updatedTask) => onSave(updatedTask));
  }

  function handleResetTimer() {
    handleReset()
  }

  useEffect(() => {
    if (task) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  function handleChecklistTextClick(index, e) {
    e.stopPropagation();
    setEditingChecklistIndex(index);
    setEditingChecklistValue(form.checklist[index].text);
  }

  function commitChecklistEdit() {
    if (editingChecklistValue.trim() && editingChecklistIndex !== null) {
      const newChecklist = [...form.checklist];
      newChecklist[editingChecklistIndex] = {
        ...newChecklist[editingChecklistIndex],
        text: editingChecklistValue.trim()
      };
      setForm(f => ({ ...f, checklist: newChecklist }));
    }
    setEditingChecklistIndex(null);
    setEditingChecklistValue("");
  }

  function handleEditChecklistItem(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitChecklistEdit();
    } else if (e.key === "Escape") {
      setEditingChecklistIndex(null);
      setEditingChecklistValue("");
    }
  }

  function commitChecklistItem() {
    if (newChecklistItem.trim()) {
      setForm(f => ({
        ...f,
        checklist: [...f.checklist, { text: newChecklistItem.trim(), checked: false }]
      }));
    }
    setNewChecklistItem("");
    setIsAddingChecklist(false);
  }

  function handleAddChecklistItem(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitChecklistItem();
    } else if (e.key === "Escape") {
      setNewChecklistItem("");
      setIsAddingChecklist(false);
    }
  }

  function commitTagAdd() {
    if (newTag.trim()) {
      const tagValue = newTag.trim().toUpperCase();
      if (!form.tags.includes(tagValue)) {
        setForm(f => ({
          ...f,
          tags: [...f.tags, tagValue]
        }));
      } else {
        showToast("Esta Tag ya existe en esta tarea");
      }
    }
    setNewTag("");
    setIsAddingTag(false);
  }

  function handleAddTag(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTagAdd();
    } else if (e.key === "Escape") {
      setNewTag("");
      setIsAddingTag(false);
    }
  }

  function handleRemoveTag(index, e) {
    e.stopPropagation();
    const newTags = form.tags.filter((_, i) => i !== index);
    setForm(f => ({ ...f, tags: newTags }));
  }

  function handleTagClick(index, e) {
    e.stopPropagation();
    setEditingTagIndex(index);
    setEditingTagValue(form.tags[index]);
  }

  function commitTagEdit() {
    if (editingTagValue.trim() && editingTagIndex !== null) {
      const newValue = editingTagValue.trim().toUpperCase();
      // Only update if not a duplicate (except for same index)
      const isDuplicate = form.tags.some((tag, i) => i !== editingTagIndex && tag === newValue);
      if (!isDuplicate) {
        const newTags = [...form.tags];
        newTags[editingTagIndex] = newValue;
        setForm(f => ({ ...f, tags: newTags }));
      }
    }
    setEditingTagIndex(null);
    setEditingTagValue("");
  }

  function handleEditTag(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTagEdit();
    } else if (e.key === "Escape") {
      setEditingTagIndex(null);
      setEditingTagValue("");
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
      onComplete(task.id)
    }
    onClose();
  }

  function handleDelete() {
    // clear any timer (especially if it's running for this task)
    handleReset();  // el hook ya sabe si este task tiene timer
    if (onDelete) { onDelete(task.id); }
    onClose();
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { month: "long", day: "numeric" });
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
            Creada: {formatDate(form.createdAt)} •{" "}
            <span className={styles[form.priority]}>
              Prioridad: {form.priority === "High" ? "Alta" : form.priority === "Low" ? "Baja" : "Media"}
            </span>
          </div>

          <div className={styles.field}>
            <textarea name="description" id="description" placeholder="  Sin descripcion." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />


          </div>
          {/* Checklist Section */}
          <div className={styles.checklistSection}>
            <div className={styles.sectionHeader}>
              <CheckSquare size={14} className={styles.sectionIcon} />
              LISTA DE TAREAS
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
                  {editingChecklistIndex === index ? (
                    <input
                      type="text"
                      className={styles.checklistEditInput}
                      value={editingChecklistValue}
                      onChange={(e) => setEditingChecklistValue(e.target.value)}
                      onKeyDown={handleEditChecklistItem}
                      onBlur={commitChecklistEdit}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className={styles.checklistText}>
                      {item.text}
                    </span>
                  )}
                  <button
                    className={styles.editChecklistItem}
                    onClick={(e) => handleChecklistTextClick(index, e)}
                  >
                    <Pencil size={14} />
                  </button>
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
                    placeholder="Ingresa un elemento a la lista..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyDown={handleAddChecklistItem}
                    onBlur={commitChecklistItem}
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
                  <span className={styles.addText}>Agregar elemento</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags Section */}
          <div className={styles.tagsSection}>
            {form.tags.map((tag, index) => (
              editingTagIndex === index ? (
                <input
                  key={index}
                  type="text"
                  className={styles.tagEditInput}
                  value={editingTagValue}
                  onChange={(e) => setEditingTagValue(e.target.value)}
                  onKeyDown={handleEditTag}
                  onBlur={commitTagEdit}
                  autoFocus
                />
              ) : (
                <span
                  key={index}
                  className={`${styles.tag}`}
                  onDoubleClick={(e) => handleTagClick(index, e)}
                >
                  #{tag}
                  <button
                    className={styles.removeTag}
                    onClick={(e) => handleRemoveTag(index, e)}
                  >
                    <X size={12} />
                  </button>
                </span>
              )
            ))}

            {isAddingTag ? (
              <input
                type="text"
                className={styles.tagInput}
                placeholder="Nombre de etiqueta"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleAddTag}
                onBlur={commitTagAdd}
                autoFocus
              />
            ) : (
              <button
                className={styles.addTagButton}
                onClick={() => setIsAddingTag(true)}
              >
                <Plus size={12} /> Agregar etiqueta
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
              className={`${styles.timerCircle} ${isRunning ? styles.timerActive : ""}`}
              style={!isStopwatch ? { "--progress": `${timerProgress}%` } : {}}
            >
              <span className={styles.timerTime}>{formattedTime}</span>
              <span className={styles.timerSubtext}>
                {isStopwatch ? "CRONOMETRO" : "SESION DE ENFOQUE"}
              </span>
            </div>
            <div className={styles.timerControls}>
              {isRunning ? (
                <button
                  className={styles.pauseButton}
                  onClick={handlePauseTimer}
                >
                  <Pause size={12} className={styles.playIcon} />
                  Pausar
                </button>
              ) : (
                <button
                  className={`${styles.startButton} ${!canStart ? styles.disabled : ""}`}
                  onClick={handleStartTimer}
                  disabled={!canStart || task.status === "completed"}
                >
                  <Play size={12} className={styles.playIcon} />
                  {isRunning ? "Pausar" : hasStarted ? "Reanudar" : "Iniciar"}
                </button>
              )}
              <button
                className={styles.resetButton}
                onClick={handleResetTimer}
                disabled={
                  (!canStart || task.status === "completed") ||
                  task.status === "completed"
                }
              >
                <RotateCcw size={16} />
              </button>
            </div>
            {/* Mode Toggle */}
            <div
              className={`${styles.modeToggleContainer} ${isRunning || task.status === "completed" ? styles.disabled : ""}`}
            >
              <button
                className={`${styles.modeOption} ${!isStopwatch ? styles.active : ""}`}
                onClick={() => (!isStopwatch ? null : handleToggleMode())}
                disabled={isRunning || task.status === "completed"}
              >
                <Timer size={14} />
                Countdown
              </button>
              <button
                className={`${styles.modeOption} ${isStopwatch ? styles.active : ""}`}
                onClick={() => (isStopwatch ? null : handleToggleMode())}
                disabled={isRunning || task.status === "completed"}
              >
                <Clock size={14} />
                Cronometro
              </button>
            </div>
            {!canStart && !isRunning && (
              <div className={styles.timerWarning}>
                Hay un temporizador activo en otra tarea
              </div>
            )}
          </div>

          {/* Card Accent Section */}
          <div className={styles.accentSection}>
            <div className={styles.accentLabel}>
              <Palette size={14} className={styles.accentIcon} />
              ACENTO DE TARJETA
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
              Marcar como completa
              <CheckCheck size={18} className={styles.completeIcon} />
            </button>
            <button className={styles.deleteButton} onClick={handleDelete}>
              Eliminar tarea
              <Trash2 size={16} className={styles.deleteIcon} />
            </button>
          </div>
        </div>
      </div>
      <Toast message={toast} visible={toastVisible} />
    </div >
  );
}

export default EditTaskModal;
