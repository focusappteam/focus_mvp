import { useEffect, useRef, useState } from "react";
import styles from "./board.module.css"
import Task from "./Task"
import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";
import { DndContext } from "@dnd-kit/core";

function Board() {
    const [zoom, setZoom] = useState(1);
    const MIN_ZOOM = 0.5;
    const MAX_ZOOM = 2;
    const ZOOM_STEP = 0.1;
    const canvasRef = useRef(null);

    const [tasks, setTasks] = useState(() => {
        const savedTasks = localStorage.getItem("tasks");
        return savedTasks ? JSON.parse(savedTasks) : [];
    })
    useEffect(() => {
        localStorage.setItem("tasks", JSON.stringify(tasks), [tasks])
    })
    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [isEditingTask, setIsEditingTask] = useState(false)
    const [editingTask, setEditingTask] = useState(null)
    const TASK_WIDTH = 260;
    const TASK_HEIGHT = 60;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener("wheel", handleWheel, { passive: false });

        return () => {
            canvas.removeEventListener("wheel", handleWheel);
        };
    }, []);


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

            const rawX = (activeTask.position?.x || 0) + delta.x;
            const rawY = (activeTask.position?.y || 0) + delta.y;

            const newPosition = {
                x: rawX,
                y: Math.max(0, rawY),
            };

            const hasCollision = prevTasks.some(task => {
                if (task.id === active.id) return false;

                return isColliding(newPosition, task.position);
            });

            if (hasCollision) {
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

        setZoom((prev) => {
            const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            const nextZoom = prev + delta;

            return Math.min(
                MAX_ZOOM,
                Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2)))
            );
        });
    }


    return (
        <div
            ref={canvasRef}
            className={styles.canvas}
            onDoubleClick={handleBoardDoubleClick}
        >

            <div
                className={styles.viewport}
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "0 0",
                }}
            >
                <DndContext onDragEnd={handleDragEnd}>
                    {tasks.map(task => (
                        <Task
                            key={task.id}
                            task={task}
                            onDoubleClick={(task) => {
                                setEditingTask(task);
                                setIsEditingTask(true);
                            }}
                        />
                    ))}
                </DndContext>
            </div>

            <div className={styles.zoomControls}>
                <button onClick={() =>
                    setZoom(z => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))
                }>+</button>

                <button onClick={() =>
                    setZoom(z => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))
                }>-</button>
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
        </div>
    );
}

export default Board;