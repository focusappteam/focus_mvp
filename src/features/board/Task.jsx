import styles from "./board.module.css";
import { useDraggable } from "@dnd-kit/core";
import React from "react";

function Task({ task, onDoubleClick, zoom, onHoverChange, isBlocked, isFocused, dragScrollOffset }) {
    const { id, title } = task;
    const { x = 0, y = 0 } = task.position || {};

    const { attributes, listeners, setNodeRef, transform } =
        useDraggable({ id, disabled: isBlocked });

    // dnd-kit delta in world coords
    const dragX = transform ? transform.x / zoom : 0;
    const dragY = transform ? transform.y / zoom : 0;

    // While the canvas auto-scrolls, the viewport moves but dnd-kit's transform
    // doesn't know about it. We subtract the accumulated canvas scroll (in world
    // coords) so the task stays visually under the cursor.
    const scrollCompX = dragScrollOffset ? dragScrollOffset.x / zoom : 0;
    const scrollCompY = dragScrollOffset ? dragScrollOffset.y / zoom : 0;

    const style = {
        transform: `translate(${x + dragX - scrollCompX}px, ${y + dragY - scrollCompY}px)`,
        cursor: isBlocked ? undefined : transform ? "grabbing" : "grab",
        zIndex: transform ? 1000 : "auto",
        boxShadow: isFocused ? "0 0 0 3px #32d56e, 0 20px 40px rgba(3, 2, 2, 0.25)"
            : transform ? "0 20px 40px rgba(0,0,0,0.25)" : undefined,
        opacity: isBlocked ? 0.35 : 1,
        pointerEvents: isBlocked ? "none" : "auto",
        transition: "opacity 0.3s ease, box-shadow 0.3s ease",
    };

    return (
        <div style={{ cursor: isBlocked ? "not-allowed" : undefined }}>
            <div
                ref={setNodeRef}
                className={`
                ${styles.task}
                ${task.status === "completed" ? styles.taskCompleted : ""}
            `}
                style={style}
                {...listeners}
                {...attributes}
                onMouseEnter={() => !isBlocked && onHoverChange(true)}
                onMouseLeave={() => onHoverChange(false)}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (isBlocked) return;
                    onDoubleClick(task);
                }}
            >
                {title}
            </div>
        </div>
    );
}

export default React.memo(Task);