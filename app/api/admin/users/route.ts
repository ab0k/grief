import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  let dbQuery = admin
    .from("profiles")
    .select("*", { count: "exact" });

  if (query.trim()) {
    dbQuery = dbQuery.ilike("username", `%${query.trim()}%`);
  }

  // order by id desc as fallback if created_at doesn't exist
  const { data: profiles, count, error: dbError } = await dbQuery
    .order("id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  // Fetch ban status — only if bans table exists
  const userIds = (profiles ?? [])
    .map((p: Record<string, unknown>) => p.user_id as string)
    .filter(Boolean);
  let bannedSet = new Set<string>();
  if (userIds.length) {
    const { data: bans } = await admin
      .from("bans")
      .select("user_id")
      .in("user_id", userIds)
      .eq("is_active", true);
    bannedSet = new Set((bans ?? []).map((b: Record<string, string>) => b.user_id));
  }

  const users = (profiles ?? []).map((p: Record<string, unknown>) => ({
    id: p.id,
    user_id: p.user_id,
    username: p.username,
    role: (p.role as string) ?? "user",
    avatar: (p.avatar as string) ?? null,
    created_at: p.created_at,
    isBanned: bannedSet.has(p.user_id as string),
  }));

  return NextResponse.json({
    users,
    pagination: {
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
