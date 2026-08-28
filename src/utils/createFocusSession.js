import { supabase } from "./supabase";

export async function createFocusSession({ userId, task, mode, startedAt }) {
  if (!userId || !task?.id) {
    throw new Error("Missing user or task data");
  }

  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: userId,
      task_id: task.id,
      workspace_id: task.workspaceId ?? null,
      mode,
      duration_seconds: 0,
      started_at: startedAt,
      ended_at: null,
      is_active: true,
      task_title: task.title ?? "",
      task_category: task.category ?? "General",
      task_priority: task.priority ?? "Medium",
      task_tags: Array.isArray(task.tags) ? task.tags : [],
      task_checklist: Array.isArray(task.checklist) ? task.checklist : [],
    })
    .select("id, user_id, task_id, workspace_id, mode, started_at")
    .single();

  if (error) {
    console.error("Failed to create focus session:", error);
    throw error;
  }

  return data;
}
