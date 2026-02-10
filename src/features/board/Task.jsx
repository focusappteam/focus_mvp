import styles from "./board.module.css"

function Task({ task }) {
    const { title, position } = task;

    return (
        <div
            className={styles.task}
            style ={{
                left: position.x,
                top: position.y
            }}
        >
            {title}
        </div>
    );
}

export default Task;