import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { id } = await params; // profile numeric id
  const { tier } = await req.json();

  const valid = ["free", "pro", "creator", "lifetime"];
  if (!valid.includes(tier)) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("profiles")
    .update({ tier })
    .eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  await admin.from("moderation_log").insert({
    admin_id: user!.id,
    action: `set_tier_${tier}`,
    content_type: "tier",
    content_value: tier,
  });

  return NextResponse.json({ success: true });
}
