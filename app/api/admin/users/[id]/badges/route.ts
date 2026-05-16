import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

// GET — badges owned by this profile
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params; // profile numeric id
  const admin = createAdminClient();

  const { data, error: dbError } = await admin
    .from("user_badges")
    .select("id, badge_id, acquired_at, badge:badges(id, key, name, description, icon, color, category)")
    .eq("profile_id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ badges: data ?? [] });
}

// POST — assign badge
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, user } = await requireAdmin();
  if (error) return error;

  const { id } = await params; // profile numeric id
  const { badge_id } = await req.json();

  if (!badge_id) return NextResponse.json({ error: "Missing badge_id" }, { status: 400 });

  const admin = createAdminClient();

  // Check if already owned
  const { data: existing } = await admin
    .from("user_badges")
    .select("id")
    .eq("profile_id", id)
    .eq("badge_id", badge_id)
    .single();

  if (existing) return NextResponse.json({ error: "Badge already assigned" }, { status: 409 });

  const { data, error: dbError } = await admin
    .from("user_badges")
    .insert({ profile_id: id, badge_id })
    .select("id, badge_id, acquired_at, badge:badges(id, key, name, description, icon, color, category)")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Log
  await admin.from("moderation_log").insert({
    admin_id: user!.id,
    action: "assign_badge",
    content_type: "badge",
    content_value: badge_id,
  });

  return NextResponse.json({ badge: data });
}
