import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useTimer } from "../../../contexts/TimerContext";
import { useBoard } from "../../../contexts/BoardContext";
import styles from "../board.module.css";
import Task from "./Task";
import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";
import { DndContext } from "@dnd-kit/core";
import { RotateCcw, Plus, Minus } from "lucide-react";
import FocusOverlay from "../../focusMode/components/FocusOverlay";
import Toast from "../../../components/UI/Toast";
import { useToast } from "../../../hooks/useToast";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;
const DEFAULT_TASK_WIDTH = 260;
const DEFAULT_TASK_HEIGHT = 120;
const HEADER_HEIGHT = 1;

function Board({ isFocusOverlayOpen, onExitFocus, sidebarOpen }) {
    const { tasks, addTask, updateTask, deleteTask, completeTask, activeWorkspaceId } = useBoard();

    const canvasRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const { toast, toastVisible, showToast } = useToast();
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [isEditingTask, setIsEditingTask] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [isPanning, setIsPanning] = useState(false);
    const [isHoveringTask, setIsHoveringTask] = useState(false);
    const [newTaskPosition, setNewTaskPosition] = useState({ x: 100, y: 100 });
    const [taskDimensions, setTaskDimensions] = useState({});
    const panStartRef = useRef({ x: 0, y: 0 });
    const isCreatingRef = useRef(false);
    const isEditingRef = useRef(false);
    useEffect(() => { isCreatingRef.current = isCreatingTask; }, [isCreatingTask]);
    useEffect(() => { isEditingRef.current = isEditingTask; }, [isEditingTask]);

    // Reset view when switching workspaces
    useEffect(() => {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    }, [activeWorkspaceId]);

    const { state: timerState } = useTimer();
    const activeTask = useMemo(() => tasks.find(t => t.id === timerState.taskId) ?? null, [tasks, timerState.taskId]);
    const focusedTaskId = useMemo(() =>
        timerState.taskId && timerState.timers[timerState.taskId]?.isRunning
            ? timerState.taskId
            : null, [timerState.taskId, timerState.timers]);

    const isFocusMode = focusedTaskId !== null;
    // Callback to update task dimensions from ResizeObserver
    const handleTaskResize = useCallback((taskId, dimensions) => {
        setTaskDimensions(prev => {
            const existing = prev[taskId];
            if (existing?.width === dimensions.width && existing?.height === dimensions.height) {
                return prev;
            }
            return { ...prev, [taskId]: dimensions };
        });
    }, []);

    // Helper to get task dimensions with fallback
    const getTaskDimensions = useCallback((taskId) => {
        return taskDimensions[taskId] || { width: DEFAULT_TASK_WIDTH, height: DEFAULT_TASK_HEIGHT };
    }, [taskDimensions]);


    function handleWheel(e) {
        if (isCreatingRef.current || isEditingRef.current) { e.stopPropagation(); return; }
        if (!e.ctrlKey) return;
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setZoom(prevZoom => {
            const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prevZoom + delta).toFixed(2)));
            setOffset(prevOffset => {
                const worldX = (mouseX - prevOffset.x) / prevZoom;
                const worldY = (mouseY - prevOffset.y) / prevZoom;
                return {
                    x: mouseX - worldX * nextZoom,
                    y: mouseY - worldY * nextZoom,
                };
            });
            return nextZoom;
        });
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.addEventListener("wheel", handleWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", handleWheel);
    }, []);

    function isColliding(posA, posB, taskIdA, taskIdB) {
        const dimA = getTaskDimensions(taskIdA);
        const dimB = getTaskDimensions(taskIdB);
        return !(
            posA.x + dimA.width < posB.x ||
            posA.x > posB.x + dimB.width ||
            posA.y + dimA.height < posB.y ||
            posA.y > posB.y + dimB.height
        );
    }

    function findFreePosition(initialPosition, tasks, newTaskId = null) {
        let testPosition = { ...initialPosition };
        const GAP = 20;
        let collidingTask;

        while ((collidingTask = tasks.find(
            task => task.id !== newTaskId && isColliding(testPosition, task.position)
        ))) {
            const collidingDim = getTaskDimensions(collidingTask.id);
            const height = Math.max(DEFAULT_TASK_HEIGHT, collidingDim.height);
            testPosition = { x: testPosition.x, y: testPosition.y + height + GAP };
        }
        return testPosition;
    }

    function getViewportCenterWorld() {
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        return {
            x: (centerX - offset.x) / zoom - DEFAULT_TASK_WIDTH / 2,
            y: (centerY - offset.y) / zoom - DEFAULT_TASK_HEIGHT / 2,
        };
    }

    function handleDragEnd(event) {
        const { active, delta } = event;
        const activeTaskData = tasks.find(t => t.id === active.id);
        if (!activeTaskData) return;

        const rawX = (activeTaskData.position?.x || 0) + delta.x / zoom;
        const rawY = (activeTaskData.position?.y || 0) + delta.y / zoom;
        const minVisibleY = (HEADER_HEIGHT - offset.y) / zoom;
        const minVisibleX = (-offset.x) / zoom;

        if (rawY < minVisibleY) {
            showToast("Esta tarea no puede ser ubicada aqui");
            return;
        }
        if (sidebarOpen && rawX < minVisibleX) {
            showToast("Esta tarea no puede ser ubicada aqui");
            return;
        }

        const newPosition = { x: rawX, y: rawY };
        const hasCollision = tasks.some(t =>
            t.id !== active.id && isColliding(newPosition, t.position, active.id, t.id)
        );
        if (hasCollision) {
            showToast("La tarea no puede ubicarse sobre otra");
            return;
        }

        updateTask({ ...activeTaskData, position: newPosition });
    }

    function handleBoardDoubleClick(e) {
        if (isCreatingTask || isEditingTask) { e.stopPropagation(); return; }
        if (isFocusMode) return;
        if (!activeWorkspaceId) {
            showToast("Selecciona un workspace primero");
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setNewTaskPosition({
            x: (e.clientX - rect.left - offset.x) / zoom,
            y: (e.clientY - rect.top - offset.y) / zoom,
        });
        setIsCreatingTask(true);
    }

    function zoomAtCenter(direction) {
        const rect = canvasRef.current.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        setZoom(prevZoom => {
            const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, +(prevZoom + direction * ZOOM_STEP).toFixed(2)));
            setOffset(prevOffset => {
                const worldX = (centerX - prevOffset.x) / prevZoom;
                const worldY = (centerY - prevOffset.y) / prevZoom;
                return {
                    x: centerX - worldX * nextZoom,
                    y: centerY - worldY * nextZoom,
                };
            });
            return nextZoom;
        });
    }

    function resetView() {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    }

    return (
        <div
            ref={canvasRef}
            className={styles.canvas}
            style={{ "--zoom": zoom }}
            onDoubleClick={handleBoardDoubleClick}
            onContextMenu={(e) => e.preventDefault()}
            onMouseDown={(e) => {
                if (isCreatingTask || isEditingTask) { e.stopPropagation(); return; }
                if (e.button !== 2) return;
                if (isHoveringTask) return;
                e.preventDefault();
                setIsPanning(true);
                panStartRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
            }}
            onMouseMove={(e) => {
                if (isCreatingTask || isEditingTask) { e.stopPropagation(); return; }
                if (!isPanning) return;
                setOffset({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
            }}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
        >
            <div
                className={styles.viewport}
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
            >
                <div className={styles.world}>
                    <DndContext onDragEnd={handleDragEnd}>
                        {tasks.map(task => (
                            <Task
                                key={task.id}
                                task={task}
                                zoom={zoom}
                                onHoverChange={setIsHoveringTask}
                                onDoubleClick={(t) => { setEditingTask(t); setIsEditingTask(true); }}
                                isBlocked={isFocusMode && task.id !== focusedTaskId}
                                isFocused={task.id === focusedTaskId}
                                onResize={handleTaskResize}
                            />
                        ))}
                    </DndContext>
                </div>
            </div>

            <div className={styles.zoomControls}>
                <button onDoubleClick={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); zoomAtCenter(-1); }}><Minus size={14} /></button>
                <button onDoubleClick={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); zoomAtCenter(1); }}><Plus size={14} /></button>
                <button onDoubleClick={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); resetView(); }}><RotateCcw size={14} /></button>
            </div>

            <button
                className={styles.createTaskButton}
                disabled={isFocusMode || !activeWorkspaceId}
                onClick={() => {
                    if (isFocusMode || !activeWorkspaceId) return;
                    setNewTaskPosition(getViewportCenterWorld());
                    setIsCreatingTask(true);
                }}
            >
                +
            </button>

            <div className={styles.hint}>
                {activeWorkspaceId
                    ? "Haz doble clic en cualquier lugar para crear una nueva tarea"
                    : "Selecciona o crea un espacio de trabajo para empezar"}
            </div>
            <Toast message={toast} visible={toastVisible} />

            {isCreatingTask && (
                <CreateTaskModal
                    onClose={() => setIsCreatingTask(false)}
                    onCreate={(newTask) => {
                        const freePosition = findFreePosition(newTask.position, tasks);
                        addTask({ ...newTask, position: freePosition });
                    }}
                    position={newTaskPosition}
                />
            )}

            {isEditingTask && editingTask && (
                <EditTaskModal
                    onClose={() => setIsEditingTask(false)}
                    onSave={(updatedTask) => {
                        updateTask(updatedTask);
                        setEditingTask(prev => prev?.id === updatedTask.id ? updatedTask : prev);
                    }}
                    onDelete={(taskId) => deleteTask(taskId)}
                    onComplete={(taskId) => completeTask(taskId)}
                    task={editingTask}

                />
            )}


            {isFocusOverlayOpen && activeTask && (
                <FocusOverlay
                    activeTask={activeTask}
                    onExit={onExitFocus}
                    onUpdateTask={updateTask}
                    onCompleteTask={(taskId) => {
                        completeTask(taskId);
                        onExitFocus();
                    }}
                />
            )}
        </div>
    );
}

export default Board;