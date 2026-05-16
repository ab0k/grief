import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data: bans, error: dbError } = await admin
    .from("bans")
    .select(`
      id, ban_type, reason, internal_notes, expires_at, is_active, created_at,
      user_id,
      profiles!bans_user_id_fkey(username, avatar)
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ bans: bans ?? [] });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { userId, banType, reason, internalNotes, expiresAt } = body;

  if (!userId || !banType || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Deactivate any existing active bans
  await admin.from("bans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);

  const { error: dbError } = await admin.from("bans").insert({
    user_id: userId,
    banned_by: user!.id,
    ban_type: banType,
    reason,
    internal_notes: internalNotes ?? null,
    expires_at: expiresAt ?? null,
    is_active: true,
  });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Log action
  await admin.from("moderation_log").insert({
    admin_id: user!.id,
    action: `ban_${banType}`,
    target_user_id: userId,
    reason,
  });

  return NextResponse.json({ success: true });
}
