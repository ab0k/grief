import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();
  const { data: badges, error: dbError } = await admin
    .from("badges")
    .select("id, key, name, description, icon, color, category, acquirable")
    .order("name");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ badges: badges ?? [] });
}
