import { supabase } from "@/integrations/supabase/client";

export async function logActivity(action: string, details?: string, metadata?: Record<string, any>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action,
    details: details || "",
    metadata: metadata || {},
  });
}
