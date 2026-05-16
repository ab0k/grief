import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null, role: null };

  // Use service role to bypass RLS and handle missing columns gracefully
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      error: NextResponse.json({ error: `Profile not found: ${profileError?.message ?? "unknown"}` }, { status: 403 }),
      user: null, role: null,
    };
  }

  const role = (profile.role as string) ?? "user";
  if (role !== "admin" && role !== "owner") {
    return { error: NextResponse.json({ error: "Forbidden — not an admin" }, { status: 403 }), user: null, role: null };
  }

  return { error: null, user, role: role as "admin" | "owner" };
}
