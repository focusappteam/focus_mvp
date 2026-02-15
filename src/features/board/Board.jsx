import { useEffect, useState } from "react";
import styles from "./board.module.css"
import { tasksMock } from "./board.mock";
import Task from "./Task"
import CreateTaskModal from "./CreateTaskModal";
import EditTaskModal from "./EditTaskModal";
import { DndContext } from "@dnd-kit/core";

function Board() {
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

            const newPosition = {
                x: (activeTask.position?.x || 0) + delta.x,
                y: (activeTask.position?.y || 0) + delta.y,
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


    return (
        <div
            className={styles.canvas}
            onDoubleClick={() => { if (!isEditingTask) setIsCreatingTask(true) }}
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

            <div className={styles.zoomControls}>
                <button>+</button>
                <button>-</button>
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