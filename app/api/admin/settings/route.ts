import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data, error: dbError } = await admin.from("admin_settings").select("key, value");
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data ?? []) settings[row.key] = row.value ?? "";

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const { error, role } = await requireAdmin();
  if (error) return error;
  if (role !== "owner") return NextResponse.json({ error: "Owner only" }, { status: 403 });

  const { key, value } = await req.json();
  if (!key) return NextResponse.json({ error: "Missing key" }, { status: 400 });

  const admin = createAdminClient();
  const { error: dbError } = await admin
    .from("admin_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
