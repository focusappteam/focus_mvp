import { useEffect, useRef, useState } from "react";
import styles from "./board.module.css"
import Task from "./Task"
import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";
import { DndContext } from "@dnd-kit/core";

function Board() {
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 2;
    const ZOOM_STEP = 0.1;

    const TASK_WIDTH = 260;
    const TASK_HEIGHT = 60;
    const HEADER_HEIGHT = 1;

    const canvasRef = useRef(null);

    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const [toast, setToast] = useState(null);
    const [toastVisible, setToastVisible] = useState(false); // control entry/exit animations

    const [tasks, setTasks] = useState(() => {
        const savedTasks = localStorage.getItem("tasks");
        return savedTasks ? JSON.parse(savedTasks) : [];
    })

    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [isEditingTask, setIsEditingTask] = useState(false)
    const [editingTask, setEditingTask] = useState(null)

    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });

    const [isHoveringTask, setIsHoveringTask] = useState(false);

    const [focusedTaskId, setFocusedTaskId] = useState(() => {
    const saved = localStorage.getItem("globalTimer");
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning && parsed.taskId) return parsed.taskId;
    }
    return null;
});
    const isFocusMode = focusedTaskId !== null;

    useEffect(() => {
        localStorage.setItem("tasks", JSON.stringify(tasks), [tasks])
    })

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, []);

    useEffect(() => {
    function syncFocusFromTimer() {
        const saved = localStorage.getItem("globalTimer");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.isRunning && parsed.taskId) {
                setFocusedTaskId(parsed.taskId);
            } else {
                setFocusedTaskId(null);
            }
        }
    }

    window.addEventListener("storage", syncFocusFromTimer);

    const interval = setInterval(syncFocusFromTimer, 1000);

    return () => {
        window.removeEventListener("storage", syncFocusFromTimer);
        clearInterval(interval);
    };
}, []);

    function showToast(message) {
        // clear any pending timers so repeated calls reset the sequence
        clearTimeout(showToast.timeout);
        clearTimeout(showToast.cleanupTimeout);

        setToast(message);
        setToastVisible(true);

        // after display duration, start exit animation
        showToast.timeout = setTimeout(() => {
            setToastVisible(false);
            // once animation finishes, actually clear toast content
            showToast.cleanupTimeout = setTimeout(() => setToast(null), 200);
        }, 2000);
    }

    function isColliding(a, b) {
        return !(
            a.x + TASK_WIDTH < b.x ||
            a.x > b.x + TASK_WIDTH ||
            a.y + TASK_HEIGHT < b.y ||
            a.y > b.y + TASK_HEIGHT
        );
    }

    function findFreePosition(initialPosition, tasks) {
        let testPosition = { ...initialPosition };
        const GAP = 20;

        let collision = true;

        while (collision) {
            collision = tasks.some(task =>
                isColliding(testPosition, task.position)
            );

            if (collision) {
                testPosition = {
                    x: testPosition.x,
                    y: testPosition.y + TASK_HEIGHT + GAP,
                };
            }
        }

        return testPosition;
    }

    function getViewportCenterWorld() {
        const rect = canvasRef.current.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const worldX = (centerX - offset.x) / zoom;
        const worldY = (centerY - offset.y) / zoom;

        return {
            x: worldX - TASK_WIDTH / 2,
            y: worldY - TASK_HEIGHT / 2,
        };
    }

    function handleDragEnd(event) {
        const { active, delta } = event;

        setTasks((prevTasks) => {
            const activeTask = prevTasks.find(t => t.id === active.id);
            if (!activeTask) return prevTasks;

            const adjustedDeltaX = delta.x / zoom;
            const adjustedDeltaY = delta.y / zoom;

            const rawX = (activeTask.position?.x || 0) + adjustedDeltaX;
            const rawY = (activeTask.position?.y || 0) + adjustedDeltaY;

            const minVisibleY =
                (HEADER_HEIGHT - offset.y) / zoom;

            const isBehindHeader = rawY < minVisibleY;

            const newPosition = {
                x: rawX,
                y: isBehindHeader ? activeTask.position.y : rawY,
            };

            if (isBehindHeader) {
                showToast("Esta tarea no puede ser ubicada aqui");
                return prevTasks;
            }

            const hasCollision = prevTasks.some(task => {
                if (task.id === active.id) return false;
                return isColliding(newPosition, task.position);
            });

            if (hasCollision) {
                showToast("La tarea no puede ubicarse sobre otra");
                return prevTasks;
            }

            return prevTasks.map(task =>
                task.id === active.id
                    ? { ...task, position: newPosition }
                    : task
            );
        });
    }

    // Store last click position for modal
    const [newTaskPosition, setNewTaskPosition] = useState({ x: 100, y: 100 });

    function handleBoardDoubleClick(e) {
        if (isFocusMode) return;
        if (!isEditingTask) {
            // Get click position relative to board
            const rect = e.currentTarget.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            const worldX = (screenX - offset.x) / zoom;
            const worldY = (screenY - offset.y) / zoom;

            setNewTaskPosition({
                x: worldX,
                y: worldY,
            });
            setIsCreatingTask(true);
        }
    }

    function handleWheel(e) {
        if (!e.ctrlKey) return;

        e.preventDefault();

        const rect = canvasRef.current.getBoundingClientRect();

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setZoom(prevZoom => {
            const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            const nextZoom = Math.min(
                MAX_ZOOM,
                Math.max(MIN_ZOOM, +(prevZoom + delta).toFixed(2))
            );

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

    function zoomAtCenter(direction) {
        const rect = canvasRef.current.getBoundingClientRect();

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        setZoom(prevZoom => {
            const nextZoom = Math.min(
                MAX_ZOOM,
                Math.max(
                    MIN_ZOOM,
                    +(prevZoom + direction * ZOOM_STEP).toFixed(2)
                )
            );

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
                if (e.button !== 2) return;
                if (isHoveringTask) return;

                e.preventDefault();

                setIsPanning(true);
                panStartRef.current = {
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y,
                };

            }}

            onMouseMove={(e) => {
                if (!isPanning) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const nextX = e.clientX - panStartRef.current.x;
                const nextY = e.clientY - panStartRef.current.y;

                setOffset({
                    x: nextX,
                    y: nextY,
                });


            }}

            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => setIsPanning(false)}
        >

            <div
                className={styles.viewport}
                style={{
                    transform: `
                        translate(${offset.x}px, ${offset.y}px)
                        scale(${zoom})
                    `,
                    transformOrigin: "0 0",
                }}
            >
                <div className={styles.world}>
                    <DndContext onDragEnd={handleDragEnd}>
                        {tasks.map(task => (
                            <Task
                                key={task.id}
                                task={task}
                                zoom={zoom}
                                onHoverChange={setIsHoveringTask}
                                onDoubleClick={(task) => {
                                    setEditingTask(task);
                                    setIsEditingTask(true);
                                }}
                                isBlocked={isFocusMode && task.id !== focusedTaskId}
                                isFocused={task.id === focusedTaskId}
                            />
                        ))}
                    </DndContext>
                </div>
            </div>

            <div className={styles.zoomControls}>
                <button onDoubleClick={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); zoomAtCenter(1) }}>+</button>
                <button onDoubleClick={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); zoomAtCenter(-1) }}>-</button>
                <button onDoubleClick={(e) => { e.stopPropagation(); }} onClick={(e) => { e.stopPropagation(); resetView() }}>restore</button>
            </div>

            <button
                className={styles.createTaskButton}
                disabled={isFocusMode}
                onClick={() => {
                    if (isFocusMode) return;
                    const centerPosition = getViewportCenterWorld();
                    setNewTaskPosition(centerPosition);
                    setIsCreatingTask(true);
                }}
            >
                +
            </button>


            <div className={styles.hint}>
                Haga doble clic en cualquier lugar para crear una nueva tarea
            </div>

            {isCreatingTask && (
                <CreateTaskModal
                    onClose={() => setIsCreatingTask(false)}
                    onCreate={(newTask) =>
                        setTasks((prevTasks) => {
                            const freePosition = findFreePosition(
                                newTask.position,
                                prevTasks
                            );

                            return [
                                ...prevTasks,
                                {
                                    ...newTask,
                                    position: freePosition,
                                },
                            ];
                        })
                    }
                    position={newTaskPosition}
                />
            )}

            {isEditingTask && editingTask && (
                <EditTaskModal
                    onClose={() => setIsEditingTask(false)}
                    onSave={(updatedTask) =>
                        setTasks((prevTasks) =>
                            prevTasks.map(task =>
                                task.id === updatedTask.id ? updatedTask : task
                            )
                        )
                    }
                    onDelete={(taskId) =>
                        setTasks((prevTasks) =>
                            prevTasks.filter(task => task.id !== taskId)
                        )
                    }
                    onComplete={(taskId) =>
                        setTasks((prevTasks) =>
                            prevTasks.map(task =>
                                task.id === taskId && task.status !== "completed"
                                    ? { ...task, status: "completed", tags: [...(task.tags || []), "COMPLETED"] }
                                    : task
                            )
                        )
                    }
                    task={editingTask}
                />
            )}

            {toast && (
                <div
                    className={`${styles.toast} ${toastVisible ? styles.toastEnter : styles.toastExit
                        }`}
                >
                    {toast}
                </div>
            )}
        </div>
    );
}

export default Board;