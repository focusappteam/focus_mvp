import styles from "./board.module.css";
import { useDraggable } from "@dnd-kit/core";
import React, { useRef, useLayoutEffect, useCallback } from "react";
import {
GripVertical
} from "lucide-react";

function Task({ task, onDoubleClick, zoom, onHoverChange, isBlocked, isFocused, onResize }) {
    const { id, title, tags, priority = "Medium", checklist = [] } = task;
    const { x = 0, y = 0 } = task.position || {};

    // Progress calculation
    const completedSubtasks = checklist.filter(s => s.checked).length;
    const totalSubtasks = checklist.length;
    const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;
    const innerRef = useRef(null);

    const { attributes, listeners, setNodeRef, transform } =
        useDraggable({ id, disabled: isBlocked });

    // Combine refs for dnd-kit and ResizeObserver
    const setRefs = useCallback((node) => {
        setNodeRef(node);
        innerRef.current = node;
    }, [setNodeRef]);

    // Report dimensions when size changes
    useLayoutEffect(() => {
        const element = innerRef.current;
        if (!element || !onResize) return;

        const observer = new ResizeObserver(([entry]) => {
            onResize(id, {
                width: entry.borderBoxSize[0]?.inlineSize ?? entry.contentRect.width,
                height: entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height,
            });
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, [id, onResize]);

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
          ref={setRefs}
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
            <div>
              <GripVertical className={styles.icon} size={20} />
            </div>
          </div>
          <h3 className={styles.title}>{title}</h3>
          <div className={styles.tagsContainer}>
            {tags?.slice(0, 5).map((tag) => (
              <span className={styles.tag} key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {totalSubtasks > 0 && (
            <div className={styles.subtaskRow}>
              <span className={styles.subtaskLabel}>
                {completedSubtasks}/{totalSubtasks}
              </span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={styles.progressPct}>{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>
    );
}

export default React.memo(Task);