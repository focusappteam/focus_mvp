import { supabase } from "./supabase";

export async function finishFocusSession({
  sessionId,
  durationSeconds,
  endedAt = new Date().toISOString(),
}) {
  if (!sessionId) {
    throw new Error("Missing focus session id");
  }

  const { data, error } = await supabase
    .from("focus_sessions")
    .update({
      duration_seconds: Math.max(0, Math.floor(durationSeconds || 0)),
      ended_at: endedAt,
      is_active: false,
    })
    .eq("id", sessionId)
    .select("id, duration_seconds, ended_at, is_active")
    .single();

  if (error) {
    console.error("Failed to finish focus session:", error);
    throw error;
  }

  return data;
}
