import styles from "./board.module.css";
import { useDraggable } from "@dnd-kit/core";
import React from "react";
import {
GripVertical
} from "lucide-react";

function Task({ task, onDoubleClick, zoom, onHoverChange, isBlocked, isFocused }) {
    const { id, title, tags, priority} = task;
    const { x = 0, y = 0 } = task.position || {};

    const { attributes, listeners, setNodeRef, transform } =
        useDraggable({ id, disabled: isBlocked });

    const dragX = transform ? transform.x / zoom : 0;
    const dragY = transform ? transform.y / zoom : 0;

    const style = {
        transform: `translate(${x + dragX}px, ${y + dragY}px)`,
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
          <div className={styles.upperSection}>
            <div className={`${styles.priority} ${styles[priority]}`}>
              <p>{priority}</p>
            </div>
            <div className={styles.icon_container}>
              <GripVertical className={styles.icon} size={20} />
            </div>
          </div>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.tags_container}>
            {
            //
            tags.slice(0,5).map((tag, index) => (
              <span className={styles.tag} key={index}>
                {tag}
              </span>
            ))
            
            }
          </div>
        </div>
      </div>
    );
}

export default React.memo(Task);