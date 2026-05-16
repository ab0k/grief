import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { decision, response: adminResponse } = await req.json();

  if (!["approved", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get appeal to find ban_id and user_id
  const { data: appeal } = await admin
    .from("ban_appeals")
    .select("ban_id, user_id")
    .eq("id", id)
    .single();

  if (!appeal) return NextResponse.json({ error: "Appeal not found" }, { status: 404 });

  // Update appeal
  await admin.from("ban_appeals").update({
    status: decision,
    admin_response: adminResponse,
    reviewed_by: user!.id,
    reviewed_at: new Date().toISOString(),
  }).eq("id", id);

  // If approved, unban the user
  if (decision === "approved") {
    await admin.from("bans").update({ is_active: false }).eq("id", appeal.ban_id);
  }

  await admin.from("moderation_log").insert({
    admin_id: user!.id,
    action: `appeal_${decision}`,
    target_user_id: appeal.user_id,
    reason: adminResponse,
  });

  return NextResponse.json({ success: true });
}
