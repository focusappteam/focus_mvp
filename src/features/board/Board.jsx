import { useState } from "react";
import styles from "./board.module.css"
import { tasksMock } from "./board.mock";
import Task from "./Task"

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
                <div className={styles.createTaskDebug}>
                    Creando nueva tarea...
                </div>
            )}

        </div>
    );
}

export default Board;