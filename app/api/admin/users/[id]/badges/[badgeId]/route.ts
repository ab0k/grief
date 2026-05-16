import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE — remove badge (badgeId = user_badges.id)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; badgeId: string }> }) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { badgeId } = await params;
  const admin = createAdminClient();

  const { error: dbError } = await admin
    .from("user_badges")
    .delete()
    .eq("id", badgeId);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await admin.from("moderation_log").insert({
    admin_id: user!.id,
    action: "remove_badge",
    content_type: "user_badge",
    content_value: badgeId,
  });

  return NextResponse.json({ success: true });
}
