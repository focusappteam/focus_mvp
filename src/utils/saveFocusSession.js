import { supabase } from './supabase';

export async function saveFocusSession({ task, mode, durationSeconds, startedAt, endedAt }) {
    // Mínimo válido: 10 segundos para evitar ruido
    if (!task?.id || durationSeconds < 10) return;

    const { error } = await supabase.from('focus_sessions').insert({
        task_id: task.id,
        workspace_id: task.workspaceId,
        mode,
        duration_seconds: durationSeconds,
        started_at: startedAt,
        ended_at: endedAt,
        // Snapshot de la tarea en este momento (para métricas históricas)
        task_title: task.title ?? '',
        task_category: task.category ?? 'General',
        task_priority: task.priority ?? 'Medium',
        task_tags: Array.isArray(task.tags) ? task.tags : [],
        task_checklist: Array.isArray(task.checklist) ? task.checklist : [],
    });

    if (error) console.error('Failed to save focus session:', error);
}