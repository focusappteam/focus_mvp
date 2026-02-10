import { useState } from "react";
import styles from "./board.module.css"
import { tasksMock } from "./board.mock";
import Task from "./Task"

function Board() {
    const [tasks, setTasks] = useState(tasksMock);

    return (
        <div className={styles.canvas}>
            {tasks.map(task => (
                <Task key={task.id} task={task} />
            ))}

            <div className={styles.zoomControls}>
                <button>+</button>
                <button>-</button>
            </div>

            <div className={styles.hint}>
                Haga doble clic en cualquier lugar para crear una nueva tarea
            </div>

        </div>
    );
}

export default Board;