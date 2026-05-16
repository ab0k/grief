import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data: appeals, error: dbError } = await admin
    .from("ban_appeals")
    .select(`
      id, message, status, created_at,
      ban_id,
      bans!ban_appeals_ban_id_fkey(ban_type, reason),
      profiles!ban_appeals_user_id_fkey(username)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ appeals: appeals ?? [] });
}
