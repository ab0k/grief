import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, role: callerRole } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { role: newRole } = await req.json();

  const validRoles = ["user", "admin", "owner"];
  if (!validRoles.includes(newRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Only owner can assign admin/owner roles
  if ((newRole === "admin" || newRole === "owner") && callerRole !== "owner") {
    return NextResponse.json({ error: "Only owner can assign admin roles" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("profiles")
    .update({ role: newRole })
    .eq("user_id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
