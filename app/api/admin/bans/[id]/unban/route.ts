import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const admin = createAdminClient();

  // id here is the profile user_id (not ban id)
  const { error: dbError } = await admin
    .from("bans")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", id)
    .eq("is_active", true);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await admin.from("moderation_log").insert({
    admin_id: user!.id,
    action: "unban",
    target_user_id: id,
  });

  return NextResponse.json({ success: true });
}
