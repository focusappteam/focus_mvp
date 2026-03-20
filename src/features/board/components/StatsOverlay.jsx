import { useState } from "react";
import {
  Download, X, TrendingUp, Clock,
  Flame, Timer, FileText, LayoutGrid, List,
} from "lucide-react";
import styles from "./Stats.module.css";
import { useStatsData, formatDuration } from "../../stats/hooks/useStatsData";
import { useBoard } from "../../../contexts/BoardContext";

// Mapea category → clase CSS del tag
function tagClass(category) {
  const map = {
    'PRODUCT DESIGN': styles.tagProductDesign,
    'ENGINEERING': styles.tagEngineering,
    'PLANNING': styles.tagPlanning,
    'General': styles.tagDefault,
  };
  return map[category] ?? styles.tagDefault;
}

// Formatea fecha para el label del grupo
function toDateLabel(isoString) {
  const d = new Date(isoString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString())
    return `TODAY, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}`;
  if (d.toDateString() === yesterday.toDateString())
    return `YESTERDAY, ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }).toUpperCase()}`;
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();
}

export default function StatsOverlay({ onClose }) {
  const [view, setView] = useState("grid");
  const [daysRange, setDaysRange] = useState(30);
  const { activeWorkspaceId } = useBoard();

  const { stats, sessions, loading } = useStatsData({
    workspaceId: activeWorkspaceId,
    daysRange,
  });

  // Mapear sessions al shape de la UI
  const mappedSessions = sessions.map(s => {
    const checklist = Array.isArray(s.task_checklist) ? s.task_checklist : [];
    return {
      id: s.id,
      date: toDateLabel(s.started_at),
      title: s.task_title || 'Untitled',
      category: s.task_category || 'General',
      time: formatDuration(s.duration_seconds ?? 0),
      checklist: {
        done: checklist.filter(i => i.checked).length,
        total: checklist.length,
      },
      tags: Array.isArray(s.task_tags) ? s.task_tags : [],
    };
  });

  // Agrupar por fecha
  const grouped = mappedSessions.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  return (
    <div className={styles.backdrop}>
      <div className={styles.panel}>

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Completed Tasks</h1>
            <p className={styles.subtitle}>
              You focused for{' '}
              <strong>{loading ? '...' : stats.totalFocusTime}</strong>{' '}
              in the last {daysRange} days.
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

        {/* ── Stats cards ── */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>COMPLETED</span>
            <span className={styles.statValue}>
              {loading ? '—' : stats.completedCount}
            </span>
            <span className={styles.statSub}>
              <TrendingUp size={12} /> Tasks done
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>FOCUS TIME</span>
            <span className={styles.statValue}>
              {loading ? '—' : stats.totalFocusTime}
            </span>
            <span className={styles.statSub}>
              <Clock size={12} /> Total focused
            </span>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>AVG SESSION</span>
            <span className={styles.statValue}>
              {loading ? '—' : stats.avgSession}
            </span>
            <span className={styles.statSub}>
              <Timer size={12} />
              {!loading && parseInt(stats.avgSession) >= 45
                ? 'Highly Consistent'
                : !loading && parseInt(stats.avgSession) >= 25
                  ? 'Consistent'
                  : 'Building Habit'}
            </span>
          </div>

          <div className={`${styles.statCard} ${styles.statCardAccent}`}>
            <span className={styles.statLabel}>DEEP WORK STREAK</span>
            <span className={styles.statValue}>
              {loading ? '—' : `${stats.streak} ${stats.streak === 1 ? 'Day' : 'Days'}`}
            </span>
            <span className={`${styles.statSub} ${styles.statSubWarm}`}>
              <Flame size={12} />
              {!loading && stats.streak > 0 ? 'Keep it up!' : 'Start today!'}
            </span>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className={styles.filtersRow}>
          <div className={styles.filterGroup}>
            <button className={styles.filterActive}>All Sessions</button>
            {[7, 30, 90].map(d => (
              <button
                key={d}
                className={daysRange === d ? styles.filterActive : styles.filterBtn}
                onClick={() => setDaysRange(d)}
              >
                Last {d} Days
              </button>
            ))}
          </div>
          <div className={styles.viewGroup}>
            <button
              className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('grid')}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setView('list')}
            >
              <List size={15} />
            </button>
          </div>
        </div>

        {/* ── Lista de sesiones ── */}
        {loading ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
            Loading sessions...
          </p>
        ) : Object.keys(grouped).length === 0 ? (
          <p style={{ color: '#aaa', textAlign: 'center', padding: '40px 0' }}>
            No sessions yet. Start focusing!
          </p>
        ) : (
          <div className={styles.taskList}>
            {Object.entries(grouped).map(([date, dateSessions]) => (
              <div key={date}>
                <p className={styles.dateLabel}>{date}</p>
                <div className={view === 'grid' ? styles.taskGrid : styles.taskColumn}>
                  {dateSessions.map(session => {
                    const progress = session.checklist.total > 0
                      ? (session.checklist.done / session.checklist.total) * 100
                      : 0;

                    return (
                      <div key={session.id} className={styles.taskCard}>
                        <div className={styles.taskCardHeader}>
                          <div>
                            <p className={styles.taskTitle}>{session.title}</p>
                            <span className={`${styles.taskTag} ${tagClass(session.category)}`}>
                              {session.category.toUpperCase()}
                            </span>
                          </div>
                          <div className={styles.taskTimeBadge}>
                            <span className={styles.taskTime}>
                              <Clock size={12} /> {session.time}
                            </span>
                            <span className={styles.taskFocused}>FOCUSED</span>
                          </div>
                        </div>

                        {session.checklist.total > 0 && (
                          <>
                            <div className={styles.checklistRow}>
                              <span className={styles.checklistLabel}>CHECKLIST SUMMARY</span>
                              <span className={styles.checklistCount}>
                                {session.checklist.done} / {session.checklist.total} DONE
                              </span>
                              <div className={styles.iconCircle}>
                                <FileText size={13} />
                              </div>
                            </div>
                            <div className={styles.progressBar}>
                              <div
                                className={styles.progressFill}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </>
                        )}

                        {/* Tags como avatares de color */}
                        {session.tags.length > 0 && (
                          <div className={styles.avatarRow}>
                            {session.tags.slice(0, 3).map((tag, i) => (
                              <div
                                key={i}
                                className={styles.avatar}
                                style={{ background: `hsl(${(tag.charCodeAt(0) * 37) % 360}, 40%, 55%)` }}
                                title={tag}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
