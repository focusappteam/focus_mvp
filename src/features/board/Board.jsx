import { useState } from "react";
import styles from "./board.module.css"
import { tasksMock } from "./board.mock";
import Task from "./Task"
import CreateTaskModal from "./CreateTaskModal";

function Board() {
    const [tasks, setTasks] = useState(tasksMock)
    const [isCreatingTask, setIsCreatingTask] = useState(false)

    return (
        <div
            className={styles.canvas}
            onDoubleClick={() => setIsCreatingTask(true)}
        >
            {tasks.map(task => (
                <Task key={task.id} task={task} />
            ))}

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


        </div>
    );
}

export default Board;