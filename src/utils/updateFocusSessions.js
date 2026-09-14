import { supabase } from "./supabase";

export async function updateFocusSessionDuration({
  sessionId,
  durationSeconds,
}) {
  if (!sessionId)
    throw new Error("updateFocusSessionDuration: sessionId requerido");

  const { error } = await supabase
    .from("focus_sessions")
    .update({ duration_seconds: durationSeconds })
    .eq("id", sessionId);

  if (error) throw error;
}
