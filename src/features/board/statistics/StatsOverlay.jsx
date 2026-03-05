import React, { useState, useEffect } from 'react';
import { X, Download, TrendingUp, Clock, Zap, Flame } from 'lucide-react';
import styles from './Stats.module.css';

const StatsOverlay = ({ onClose, tasks = [] }) => {
  const [activeFilter, setActiveFilter] = useState('All Sessions');
  const [viewMode, setViewMode] = useState('grid');

  const completedTasks = tasks.filter(t => t.status === 'completed');

  // Group completed tasks by date
  const groupedByDate = completedTasks.reduce((acc, task) => {
    const date = task.completedAt
      ? new Date(task.completedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()
      : 'TODAY';
    if (!acc[date]) acc[date] = [];
    acc[date].push(task);
    return acc;
  }, {});

  const totalFocusTime = completedTasks.reduce((acc, t) => acc + (t.timeActive || 0), 0);
  const totalHours = Math.floor(totalFocusTime / 3600);
  const totalMinutes = Math.floor((totalFocusTime % 3600) / 60);
  const avgSession = completedTasks.length > 0 ? Math.floor(totalFocusTime / completedTasks.length / 60) : 0;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getChecklist = (task) => {
    const total = task.checklist?.length || 0;
    const done = task.checklist?.filter(i => i.checked).length || 0;
    return { total, done };
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Completed Tasks</h1>
            <p className={styles.subtitle}>
              You focused for <strong>{totalHours}h {totalMinutes}m</strong> this week. Maintaining deep state.
            </p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.exportBtn}>
              <Download size={16} /> Export History
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>COMPLETED</span>
            <span className={styles.statValue}>{completedTasks.length}</span>
            <span className={styles.statTrend}>
              <TrendingUp size={12} /> +12% vs last week
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>FOCUS TIME</span>
            <span className={styles.statValue}>{totalHours}h {totalMinutes}m</span>
            <span className={styles.statTrend}>
              <TrendingUp size={12} /> +5% intensity
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>AVG SESSION</span>
            <span className={styles.statValue}>{avgSession}m</span>
            <span className={styles.statTrendGreen}>
              <Zap size={12} /> Highly Consistent
            </span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardAccent}`}>
            <span className={styles.statLabel}>DEEP WORK STREAK</span>
            <span className={styles.statValue}>14 Days</span>
            <span className={styles.statTrend}>
              <Flame size={12} /> Personal Record
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterLeft}>
            {['All Sessions', 'Project: Design System', 'Last 30 Days'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${activeFilter === f ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f} {f !== 'All Sessions' && <span className={styles.filterArrow}>▾</span>}
              </button>
            ))}
          </div>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className={styles.taskList}>
          {completedTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No completed tasks yet. Keep focusing! </p>
            </div>
          ) : (
            Object.entries(groupedByDate).map(([date, dateTasks]) => (
              <div key={date}>
                <div className={styles.dateLabel}>{date}</div>
                <div className={viewMode === 'grid' ? styles.taskGrid : styles.taskListView}>
                  {dateTasks.map(task => {
                    const { total, done } = getChecklist(task);
                    const progress = total > 0 ? (done / total) * 100 : 100;
                    return (
                      <div key={task.id} className={styles.taskCard}>
                        <div className={styles.taskCardHeader}>
                          <div>
                            <h3 className={styles.taskCardTitle}>{task.title}</h3>
                            {task.tags && task.tags.length > 0 && (
                              <div className={styles.taskTags}>
                                {task.tags.filter(t => t !== 'COMPLETED').map((tag, i) => (
                                  <span key={i} className={styles.taskTag}>{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className={styles.taskTime}>
                            <Clock size={12} />
                            <span>{formatTime(task.timeActive || 0)}</span>
                            <span className={styles.taskFocused}>FOCUSED</span>
                          </div>
                        </div>
                        <div className={styles.taskProgress}>
                          <span className={styles.progressLabel}>CHECKLIST SUMMARY</span>
                          <span className={styles.progressCount}>{done} / {total} DONE</span>
                        </div>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default StatsOverlay;