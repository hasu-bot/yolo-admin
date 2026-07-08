import { getServiceClient } from "./supabase-server";
import { isToday } from "./format";
import type {
  ActivityLog,
  AppUser,
  Consultation,
  DiscordLinkCode,
  EventRow,
  LetterBooking,
  RequestKind,
  RequestStatus,
  UnifiedRequest,
  UserIdentity,
  UserLabel,
} from "./types";

function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()%]/g, "").trim().slice(0, 100);
}

export interface DashboardStats {
  newCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  totalCount: number;
  todayLineSignups: number;
  recentLinkCodes: DiscordLinkCode[];
  recentLogs: ActivityLog[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getServiceClient();

  const [bookings, consultations, users, linkCodes, logs] = await Promise.all([
    supabase.from("letter_bookings").select("status"),
    supabase.from("consultations").select("status"),
    supabase.from("users").select("id, labels, created_at"),
    supabase.from("discord_link_codes").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  const statuses = [...(bookings.data ?? []), ...(consultations.data ?? [])] as { status: RequestStatus }[];
  const countBy = (status: RequestStatus) => statuses.filter((s) => s.status === status).length;

  const todayLineSignups = (users.data ?? []).filter(
    (u) => Array.isArray(u.labels) && u.labels.includes("line_registered") && isToday(u.created_at)
  ).length;

  return {
    newCount: countBy("new"),
    inProgressCount: countBy("in_progress"),
    completedCount: countBy("completed"),
    cancelledCount: countBy("cancelled"),
    totalCount: statuses.length,
    todayLineSignups,
    recentLinkCodes: (linkCodes.data ?? []) as DiscordLinkCode[],
    recentLogs: (logs.data ?? []) as ActivityLog[],
  };
}

export interface RequestsQuery {
  status?: RequestStatus;
  kind?: RequestKind | "all";
  page?: number;
  pageSize?: number;
}

export interface RequestsResult {
  items: UnifiedRequest[];
  total: number;
  page: number;
  pageSize: number;
}

const REQUESTS_FETCH_LIMIT = 300;

export async function fetchRequests(query: RequestsQuery = {}): Promise<RequestsResult> {
  const { status, kind = "all", page = 1, pageSize = 10 } = query;
  const supabase = getServiceClient();
  const items: UnifiedRequest[] = [];

  if (kind === "all" || kind === "letter_booking") {
    let q = supabase
      .from("letter_bookings")
      .select("id, user_id, requester_name, title, status, created_at, updated_at, booking_data")
      .order("created_at", { ascending: false })
      .limit(REQUESTS_FETCH_LIMIT);
    if (status) q = q.eq("status", status);
    const { data } = await q;
    for (const row of data ?? []) {
      const { booking_data, ...rest } = row as Omit<UnifiedRequest, "kind"> & {
        booking_data: LetterBooking["booking_data"];
      };
      items.push({ ...rest, kind: "letter_booking", followupCount: booking_data?.followups?.length ?? 0 });
    }
  }

  if (kind === "all" || kind === "consultation") {
    let q = supabase
      .from("consultations")
      .select("id, user_id, requester_name, title, status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(REQUESTS_FETCH_LIMIT);
    if (status) q = q.eq("status", status);
    const { data } = await q;
    for (const row of data ?? []) {
      items.push({ ...(row as Omit<UnifiedRequest, "kind">), kind: "consultation" });
    }
  }

  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total, page, pageSize };
}

export type RequestDetail = ({ kind: "letter_booking" } & LetterBooking) | ({ kind: "consultation" } & Consultation);

export async function fetchRequestDetail(kind: RequestKind, id: string): Promise<RequestDetail | null> {
  const supabase = getServiceClient();
  const table = kind === "letter_booking" ? "letter_bookings" : "consultations";
  const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return { ...(data as LetterBooking & Consultation), kind } as RequestDetail;
}

export async function updateRequest(
  kind: RequestKind,
  id: string,
  patch: { status?: RequestStatus; admin_memo?: string }
): Promise<boolean> {
  const supabase = getServiceClient();
  const table = kind === "letter_booking" ? "letter_bookings" : "consultations";
  const { error } = await supabase
    .from(table)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export interface UsersQuery {
  label?: UserLabel;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface UsersResult {
  items: (AppUser & { requestCount: number })[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchUsers(query: UsersQuery = {}): Promise<UsersResult> {
  const { label, search, page = 1, pageSize = 20 } = query;
  const supabase = getServiceClient();

  let q = supabase.from("users").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (label) q = q.contains("labels", [label]);
  if (search) {
    const term = sanitizeSearchTerm(search);
    if (term) q = q.or(`display_name.ilike.%${term}%,email.ilike.%${term}%,id.eq.${term}`);
  }
  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1);

  const { data, count } = await q;
  const users = (data ?? []) as AppUser[];
  const ids = users.map((u) => u.id);

  const requestCounts = new Map<string, number>();
  if (ids.length > 0) {
    const [bookings, consultations] = await Promise.all([
      supabase.from("letter_bookings").select("user_id").in("user_id", ids),
      supabase.from("consultations").select("user_id").in("user_id", ids),
    ]);
    for (const row of [...(bookings.data ?? []), ...(consultations.data ?? [])]) {
      const uid = (row as { user_id: string | null }).user_id;
      if (!uid) continue;
      requestCounts.set(uid, (requestCounts.get(uid) ?? 0) + 1);
    }
  }

  return {
    items: users.map((u) => ({ ...u, requestCount: requestCounts.get(u.id) ?? 0 })),
    total: count ?? users.length,
    page,
    pageSize,
  };
}

export interface UserDetail {
  user: AppUser;
  identities: UserIdentity[];
  requests: UnifiedRequest[];
  logs: ActivityLog[];
}

export async function fetchUserDetail(id: string): Promise<UserDetail | null> {
  const supabase = getServiceClient();
  const { data: user } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
  if (!user) return null;

  const [identities, bookings, consultations, logs] = await Promise.all([
    supabase.from("user_identities").select("*").eq("user_id", id).order("linked_at", { ascending: false }),
    supabase
      .from("letter_bookings")
      .select("id, user_id, requester_name, title, status, created_at, updated_at")
      .eq("user_id", id),
    supabase
      .from("consultations")
      .select("id, user_id, requester_name, title, status, created_at, updated_at")
      .eq("user_id", id),
    supabase.from("activity_logs").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  const requests: UnifiedRequest[] = [
    ...(bookings.data ?? []).map((r) => ({ ...(r as Omit<UnifiedRequest, "kind">), kind: "letter_booking" as const })),
    ...(consultations.data ?? []).map((r) => ({ ...(r as Omit<UnifiedRequest, "kind">), kind: "consultation" as const })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return {
    user: user as AppUser,
    identities: (identities.data ?? []) as UserIdentity[],
    requests,
    logs: (logs.data ?? []) as ActivityLog[],
  };
}

export async function fetchEvents(): Promise<EventRow[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("synced_at", { ascending: false, nullsFirst: false })
    .limit(100);
  return (data ?? []) as EventRow[];
}

export interface LogsQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface LogsResult {
  items: ActivityLog[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchActivityLogs(query: LogsQuery = {}): Promise<LogsResult> {
  const { search, page = 1, pageSize = 30 } = query;
  const supabase = getServiceClient();
  let q = supabase.from("activity_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (search) {
    const term = sanitizeSearchTerm(search);
    if (term) q = q.or(`action.ilike.%${term}%,actor.ilike.%${term}%`);
  }
  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1);
  const { data, count } = await q;
  return { items: (data ?? []) as ActivityLog[], total: count ?? 0, page, pageSize };
}
