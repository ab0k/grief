import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

  const admin = createAdminClient();
  const { data: logs, error: dbError } = await admin
    .from("moderation_log")
    .select(`
      id, action, content_type, content_value, reason, created_at,
      target_user_id,
      profiles!moderation_log_target_user_id_fkey(username)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ logs: logs ?? [] });
}
