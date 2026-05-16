import { NextResponse } from "next/server";
import { requireAdmin } from "../_auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const admin = createAdminClient();

  const [
    { count: totalUsers },
    { count: activeBans },
    { count: pendingAppeals },
    { count: totalAdmins },
    { count: openTickets },
    { count: openIncidents },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("bans").select("*", { count: "exact", head: true }).eq("is_active", true),
    admin.from("ban_appeals").select("*", { count: "exact", head: true }).eq("status", "pending"),
    admin.from("profiles").select("*", { count: "exact", head: true }).in("role", ["admin", "owner"]),
    admin.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
    admin.from("incidents").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activeBans: activeBans ?? 0,
    pendingAppeals: pendingAppeals ?? 0,
    totalAdmins: totalAdmins ?? 0,
    openTickets: openTickets ?? 0,
    openIncidents: openIncidents ?? 0,
  });
}
