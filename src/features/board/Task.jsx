import styles from "./board.module.css";
import { useDraggable } from "@dnd-kit/core";

function Task({ task }) {
    const { id, title } = task;
    const { x = 0, y = 0 } = task.position || {};

    const { attributes, listeners, setNodeRef, transform } =
        useDraggable({
            id,
        })

    const style = {
        transform: `
            translate(
                ${x + (transform?.x || 0)}px,
                ${y + (transform?.y || 0)}px
            )
        `,
    }

    return (
        <div
            ref={setNodeRef}
            className={styles.task}
            style={style}
            {...listeners}
            {...attributes}
        >
            {title}
        </div>
    );
}

export default Task;
