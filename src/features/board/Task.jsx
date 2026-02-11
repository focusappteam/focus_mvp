import styles from "./board.module.css";

function Task({ task }) {
    const { title } = task;
    const { x = 0, y = 0 } = task.position || {};

    return (
        <div
            className={styles.task}
            style={{
                transform: `translate(${x}px, ${y}px)`
            }}
        >
            {title}
        </div>
    );
}

export default Task;
