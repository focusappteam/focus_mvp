import styles from "./board.module.css";
import { useDraggable } from "@dnd-kit/core";

function Task({ task, onDoubleClick, zoom, onHoverChange }) {
    const { id, title } = task;
    const { x = 0, y = 0 } = task.position || {};

    const { attributes, listeners, setNodeRef, transform } =
        useDraggable({
            id,
        })

    const dragX = transform ? transform.x / zoom : 0;
    const dragY = transform ? transform.y / zoom : 0;

    const style = {
        transform: `
        translate(
            ${x + dragX}px,
            ${y + dragY}px
        )
    `,
        cursor: transform ? "grabbing" : "grab",
        zIndex: transform ? 1000 : "auto",
        boxShadow: transform
            ? "0 20px 40px rgba(0,0,0,0.25)"
            : undefined,
    };




    return (
        <div
            ref={setNodeRef}
            className={styles.task}
            style={style}
            {...listeners}
            {...attributes}
            onMouseEnter={() => onHoverChange(true)}
            onMouseLeave={() => onHoverChange(false)}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onDoubleClick(task);
            }}
        >
            {title}
        </div>
    );
}

export default Task;
