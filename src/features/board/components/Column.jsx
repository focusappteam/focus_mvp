/*
import styles from "./board.module.css"
import Task from "./Task"

function Column({ title, status, tasks }) {
    const filtroTask = tasks.filter(task => task.status === status)

    return (
        <div className={styles.column}>
            <h3>{title}</h3>

            {filtroTask.map(task => (
                <Task key={task.id} title={task.title} />
            ))}
        </div>
    );
}

export default Column;
*/

/*
aqui solo estaba probando, pero lo comente porque la idea es un tablero libre no uno como tipo kanban que esta rigido
por columnas aunque puedas mover las tareas, no es tan libre como el tablero que queremos llegar
ignoren esto jajaja
*/