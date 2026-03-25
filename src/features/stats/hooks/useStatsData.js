import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../utils/supabase';

// Convierte segundos a "Xh Ym" o "Xm"
export function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

// Calcula racha de días consecutivos con al menos 1 sesión
function calcStreak(sessions) {
    if (!sessions.length) return 0;

    const days = [...new Set(
        sessions.map(s => new Date(s.started_at).toDateString())
    )].map(d => new Date(d)).sort((a, b) => b - a); // desc

    let streak = 1;
    for (let i = 1; i < days.length; i++) {
        const diff = (days[i - 1] - days[i]) / (1000 * 60 * 60 * 24);
        if (diff === 1) streak++;
        else break;
    }
    return streak;
}

// Agrupa sesiones por fecha para las cards
function groupByDate(sessions) {
    return sessions.reduce((acc, session) => {
        const date = new Date(session.started_at).toDateString();
        if (!acc[date]) acc[date] = [];
        acc[date].push(session);
        return acc;
    }, {});
}

export function useStatsData({ workspaceId = null, daysRange = 30 } = {}) {
    const [sessions, setSessions] = useState([]);
    const [completedTasks, setCompleted] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const since = new Date();
            since.setDate(since.getDate() - daysRange);
            const sinceISO = since.toISOString();

            // 1. Sesiones de foco en el rango
            let query = supabase
                .from('focus_sessions')
                .select('*')
                .gte('started_at', sinceISO)
                .order('started_at', { ascending: false });

            if (workspaceId) query = query.eq('workspace_id', workspaceId);

            const { data: sessionData, error: sessionError } = await query;
            if (sessionError) throw sessionError;

            // 2. Tareas completadas en el rango
            let taskQuery = supabase
                .from('tasks')
                .select('id, title, category, priority, tags, checklist, color, updated_at, workspace_id')
                .eq('status', 'completed')
                .gte('updated_at', sinceISO);

            if (workspaceId) taskQuery = taskQuery.eq('workspace_id', workspaceId);

            const { data: taskData, error: taskError } = await taskQuery;
            if (taskError) throw taskError;

            setSessions(sessionData ?? []);
            setCompleted(taskData ?? []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [workspaceId, daysRange]);

    useEffect(() => { load(); }, [load]);

    // ── Métricas calculadas ───────────────────────────────
    const totalFocusSeconds = sessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
    const avgSessionSeconds = sessions.length
        ? Math.round(totalFocusSeconds / sessions.length)
        : 0;
    const streak = calcStreak(sessions);
    const sessionsByDate = groupByDate(sessions);

    return {
        loading,
        error,
        reload: load,
        // Métricas para los cards superiores
        stats: {
            completedCount: completedTasks.length,
            totalFocusTime: formatDuration(totalFocusSeconds),
            avgSession: formatDuration(avgSessionSeconds),
            streak,
        },
        // Para la lista de sesiones
        sessionsByDate,   // { "Mon Oct 26 2026": [...sesiones], ... }
        sessions,
        completedTasks,
    };
}
