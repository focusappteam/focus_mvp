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

    function showToast(message) {
        setToast(message);
        clearTimeout(showToast.timeout);
        showToast.timeout = setTimeout(() => {
            setToast(null);
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

    function handleDragEnd(event) {
        const { active, delta } = event;

        setTasks((prevTasks) => {
            const activeTask = prevTasks.find(t => t.id === active.id);
            if (!activeTask) return prevTasks;

            const adjustedDeltaX = delta.x / zoom;
            const adjustedDeltaY = delta.y / zoom;

            const rawX = (activeTask.position?.x || 0) + adjustedDeltaX;
            const rawY = (activeTask.position?.y || 0) + adjustedDeltaY;

            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();

            const minVisibleY =
                (HEADER_HEIGHT - offset.y) / zoom;

            const isBehindHeader = rawY < minVisibleY;

            const newPosition = {
                x: rawX,
                y: isBehindHeader ? activeTask.position.y : rawY,
            };

            if (isBehindHeader) {
                showToast("This task can’t be placed here");
                return prevTasks;
            }

            const hasCollision = prevTasks.some(task => {
                if (task.id === active.id) return false;
                return isColliding(newPosition, task.position);
            });

            if (hasCollision) {
                showToast("This task can’t be placed here");
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
        if (!isEditingTask) {
            // Get click position relative to board
            const rect = e.currentTarget.getBoundingClientRect();
            setNewTaskPosition({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
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
                            />
                        ))}
                    </DndContext>
                </div>
            </div>

            <div className={styles.zoomControls}>
                <button onClick={() => zoomAtCenter(1)}>+</button>
                <button onClick={() => zoomAtCenter(-1)}>-</button>
            </div>

            <button
                className={styles.createTaskButton}
                onClick={() => setIsCreatingTask(true)}
            >+</button>

            <div className={styles.hint}>
                Haga doble clic en cualquier lugar para crear una nueva tarea
            </div>

            {isCreatingTask && (
                <CreateTaskModal
                    onClose={() => setIsCreatingTask(false)}
                    onCreate={(newTask) =>
                        setTasks((prevTasks) => [...prevTasks, newTask])
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
                    task={editingTask}
                />
            )}

            {toast && (
                <div className={styles.toast}>
                    {toast}
                </div>
            )}
        </div>
    );
}

export default Board;