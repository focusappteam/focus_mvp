import { useState } from "react";
import {
  Download,
  X,
  TrendingUp,
  CheckCircle,
  Flame,
  Clock,
  FileText,
  Link,
  LayoutGrid,
  List,
} from "lucide-react";
import styles from "./stats.module.css";

const mockTasks = [
  {
    id: 1,
    date: "TODAY, OCTOBER 26",
    title: "Design System Audit & Documentation",
    tag: "PRODUCT DESIGN",
    tagClass: "tagProductDesign",
    time: "3h 45m",
    checklist: { done: 8, total: 8 },
    Icon: FileText,
    avatars: ["#4c6f70", "#6b9e94"],
  },
  {
    id: 2,
    date: "TODAY, OCTOBER 26",
    title: "API Integration for Dashboard Analytics",
    tag: "ENGINEERING",
    tagClass: "tagEngineering",
    time: "1h 20m",
    checklist: { done: 3, total: 3 },
    Icon: Link,
    avatars: ["#c17b5e"],
  },
  {
    id: 3,
    date: "YESTERDAY, OCTOBER 25",
    title: "Weekly Sync & Strategy Refinement",
    tag: "PLANNING",
    tagClass: "tagPlanning",
    time: "45m",
    checklist: { done: 1, total: 1 },
    Icon: CheckCircle,
    avatars: ["#4c6f70"],
  },
];

export default function StatsOverlay({ onClose }) {
  const [view, setView] = useState("grid");

  const grouped = mockTasks.reduce((acc, task) => {
    if (!acc[task.date]) acc[task.date] = [];
    acc[task.date].push(task);
    return acc;
  }, {});

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Completed Tasks</h1>
            <p className={styles.subtitle}>
              You focused for <strong>24h 15m</strong> this week. Maintaining
              deep state.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.exportBtn}>
              <Download size={14} /> Export History
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>COMPLETED</span>
            <span className={styles.statValue}>128</span>
            <span className={styles.statSub}>
              <TrendingUp size={12} /> +12% vs last week
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>FOCUS TIME</span>
            <span className={styles.statValue}>84h 20m</span>
            <span className={styles.statSub}>
              <TrendingUp size={12} /> +5% intensity
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>AVG SESSION</span>
            <span className={styles.statValue}>52m</span>
            <span className={styles.statSub}>
              <CheckCircle size={12} /> Highly Consistent
            </span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardAccent}`}>
            <span className={styles.statLabel}>DEEP WORK STREAK</span>
            <span className={styles.statValue}>14 Days</span>
            <span className={`${styles.statSub} ${styles.statSubWarm}`}>
              <Flame size={12} /> Personal Record
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <button className={styles.filterActive}>All Sessions</button>
            <button className={styles.filterBtn}>
              Project: Design System ▾
            </button>
            <button className={styles.filterBtn}>Last 30 Days ▾</button>
          </div>
          <div className={styles.viewGroup}>
            <button
              className={`${styles.viewBtn} ${view === "grid" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              className={`${styles.viewBtn} ${view === "list" ? styles.viewBtnActive : ""}`}
              onClick={() => setView("list")}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Task list */}
        <div className={styles.taskList}>
          {Object.entries(grouped).map(([date, tasks]) => (
            <div key={date}>
              <p className={styles.dateLabel}>{date}</p>
              <div
                className={
                  view === "grid" ? styles.taskGrid : styles.taskColumn
                }
              >
                {tasks.map((task) => {
                  const progress =
                    (task.checklist.done / task.checklist.total) * 100;
                  const TaskIcon = task.Icon;
                  return (
                    <div key={task.id} className={styles.taskCard}>
                      <div className={styles.taskCardHeader}>
                        <div>
                          <h3 className={styles.taskTitle}>{task.title}</h3>
                          <span
                            className={`${styles.taskTag} ${styles[task.tagClass]}`}
                          >
                            {task.tag}
                          </span>
                        </div>
                        <div className={styles.taskTimeBadge}>
                          <span className={styles.taskTime}>
                            <Clock size={12} /> {task.time}
                          </span>
                          <span className={styles.taskFocused}>FOCUSED</span>
                        </div>
                      </div>
                      <div className={styles.checklistRow}>
                        <span className={styles.checklistLabel}>
                          CHECKLIST SUMMARY
                        </span>
                        <span className={styles.checklistCount}>
                          {task.checklist.done} / {task.checklist.total} DONE
                        </span>
                        <div className={styles.iconCircle}>
                          <TaskIcon size={14} />
                        </div>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className={styles.avatarRow}>
                        {task.avatars.map((color, i) => (
                          <div
                            key={i}
                            className={styles.avatar}
                            style={{ background: color }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
