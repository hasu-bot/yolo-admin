import { getServiceClient } from "./supabase-server";
import { isToday } from "./format";
import {
  bookingTitle,
  normalizeStatus,
  userDisplayName,
  STATUS_WRITE_VALUE,
  type ActivityLog,
  type AppUser,
  type CanonicalStatus,
  type Consultation,
  type DiscordLinkCode,
  type EventRow,
  type LetterBooking,
  type RequestKind,
  type UnifiedRequest,
  type UserIdentity,
  type UserLabel,
} from "./types";

function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()%]/g, "").trim().slice(0, 100);
}

/** users をまとめて引いて id→表示名 のマップを作る */
async function fetchUserNames(userIds: (string | null)[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter((id): id is string => !!id))];
  const names = new Map<string, string>();
  if (ids.length === 0) return names;
  const supabase = getServiceClient();
  const { data } = await supabase.from("users").select("id, nickname, full_name").in("id", ids);
  for (const row of (data ?? []) as Pick<AppUser, "id" | "nickname" | "full_name">[]) {
    names.set(row.id, userDisplayName(row));
  }
  return names;
}

function toUnifiedBooking(row: LetterBooking, names: Map<string, string>): UnifiedRequest {
  return {
    id: row.id,
    kind: "letter_booking",
    title: bookingTitle(row),
    requesterName: row.user_id ? (names.get(row.user_id) ?? null) : null,
    userId: row.user_id,
    rawStatus: row.status,
    status: normalizeStatus(row.status),
    followupCount: row.booking_data?.followups?.length ?? 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toUnifiedConsultation(row: Consultation): UnifiedRequest {
  return {
    id: row.id,
    kind: "consultation",
    title: row.title,
    requesterName: row.is_anonymous ? "（匿名）" : (row.nickname ?? null),
    userId: row.yolo_user_id,
    rawStatus: row.status,
    status: normalizeStatus(row.status),
    followupCount: 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface DashboardStats {
  newCount: number;
  inProgressCount: number;
  completedCount: number;
  cancelledCount: number;
  totalCount: number;
  todayLineSignups: number;
  discordMemberCount: number;
  recentLinkCodes: DiscordLinkCode[];
  recentLogs: ActivityLog[];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const supabase = getServiceClient();

  const [bookings, consultations, users, linkCodes, logs] = await Promise.all([
    supabase.from("letter_bookings").select("status"),
    supabase.from("consultations").select("status"),
    supabase.from("users").select("id, user_labels, created_at"),
    supabase.from("discord_link_codes").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("activity_logs").select("*").order("occurred_at", { ascending: false }).limit(10),
  ]);

  const statuses = [...(bookings.data ?? []), ...(consultations.data ?? [])]
    .map((row) => normalizeStatus((row as { status: string }).status));
  const countBy = (status: CanonicalStatus) => statuses.filter((s) => s === status).length;

  const todayLineSignups = (users.data ?? []).filter(
    (u) => Array.isArray(u.user_labels) && u.user_labels.includes("line_registered") && isToday(u.created_at)
  ).length;
  const discordMemberCount = (users.data ?? []).filter(
    (u) => Array.isArray(u.user_labels) && u.user_labels.includes("discord_member")
  ).length;

  return {
    newCount: countBy("new"),
    inProgressCount: countBy("in_progress"),
    completedCount: countBy("completed"),
    cancelledCount: countBy("cancelled"),
    totalCount: statuses.length,
    todayLineSignups,
    discordMemberCount,
    recentLinkCodes: (linkCodes.data ?? []) as DiscordLinkCode[],
    recentLogs: (logs.data ?? []) as ActivityLog[],
  };
}

export interface RequestsQuery {
  status?: CanonicalStatus;
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

  const [bookings, consultations] = await Promise.all([
    kind === "all" || kind === "letter_booking"
      ? supabase.from("letter_bookings").select("*").order("created_at", { ascending: false }).limit(REQUESTS_FETCH_LIMIT)
      : Promise.resolve({ data: [] }),
    kind === "all" || kind === "consultation"
      ? supabase.from("consultations").select("*").order("created_at", { ascending: false }).limit(REQUESTS_FETCH_LIMIT)
      : Promise.resolve({ data: [] }),
  ]);

  const bookingRows = (bookings.data ?? []) as LetterBooking[];
  const names = await fetchUserNames(bookingRows.map((b) => b.user_id));

  let items: UnifiedRequest[] = [
    ...bookingRows.map((row) => toUnifiedBooking(row, names)),
    ...((consultations.data ?? []) as Consultation[]).map(toUnifiedConsultation),
  ];

  // ステータスは語彙ゆれがあるため正準化した上でアプリ側でフィルタする
  if (status) items = items.filter((item) => item.status === status);
  items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  const total = items.length;
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total, page, pageSize };
}

export type RequestDetail =
  | { kind: "letter_booking"; row: LetterBooking; requesterName: string | null }
  | { kind: "consultation"; row: Consultation; requesterName: string | null };

export async function fetchRequestDetail(kind: RequestKind, id: string): Promise<RequestDetail | null> {
  const supabase = getServiceClient();
  if (kind === "letter_booking") {
    const { data } = await supabase.from("letter_bookings").select("*").eq("id", id).maybeSingle();
    if (!data) return null;
    const row = data as LetterBooking;
    const names = await fetchUserNames([row.user_id]);
    return { kind, row, requesterName: row.user_id ? (names.get(row.user_id) ?? null) : null };
  }
  const { data } = await supabase.from("consultations").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as Consultation;
  return { kind, row, requesterName: row.is_anonymous ? "（匿名）" : (row.nickname ?? null) };
}

export async function updateRequest(
  kind: RequestKind,
  id: string,
  patch: { status?: CanonicalStatus; admin_memo?: string }
): Promise<boolean> {
  const supabase = getServiceClient();

  if (kind === "consultation") {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status) update.status = STATUS_WRITE_VALUE.consultation[patch.status];
    if (patch.admin_memo !== undefined) update.admin_memo = patch.admin_memo;
    const { error } = await supabase.from("consultations").update(update).eq("id", id);
    return !error;
  }

  // letter_bookings に admin_memo カラムは無いため booking_data(jsonb) 内に保持する
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.status) update.status = STATUS_WRITE_VALUE.letter_booking[patch.status];
  if (patch.admin_memo !== undefined) {
    const { data } = await supabase.from("letter_bookings").select("booking_data").eq("id", id).maybeSingle();
    if (!data) return false;
    update.booking_data = { ...(data.booking_data ?? {}), admin_memo: patch.admin_memo };
  }
  const { error } = await supabase.from("letter_bookings").update(update).eq("id", id);
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
  if (label) q = q.contains("user_labels", [label]);
  if (search) {
    const term = sanitizeSearchTerm(search);
    if (term) {
      q = q.or(
        `nickname.ilike.%${term}%,full_name.ilike.%${term}%,email.ilike.%${term}%,instagram.ilike.%${term}%`
      );
    }
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
      supabase.from("consultations").select("yolo_user_id").in("yolo_user_id", ids),
    ]);
    for (const row of bookings.data ?? []) {
      const uid = (row as { user_id: string | null }).user_id;
      if (uid) requestCounts.set(uid, (requestCounts.get(uid) ?? 0) + 1);
    }
    for (const row of consultations.data ?? []) {
      const uid = (row as { yolo_user_id: string | null }).yolo_user_id;
      if (uid) requestCounts.set(uid, (requestCounts.get(uid) ?? 0) + 1);
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
    supabase.from("letter_bookings").select("*").eq("user_id", id),
    supabase.from("consultations").select("*").eq("yolo_user_id", id),
    supabase.from("activity_logs").select("*").eq("user_id", id).order("occurred_at", { ascending: false }).limit(50),
  ]);

  const appUser = user as AppUser;
  const names = new Map([[appUser.id, userDisplayName(appUser)]]);

  const requests: UnifiedRequest[] = [
    ...((bookings.data ?? []) as LetterBooking[]).map((row) => toUnifiedBooking(row, names)),
    ...((consultations.data ?? []) as Consultation[]).map(toUnifiedConsultation),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  return {
    user: appUser,
    identities: (identities.data ?? []) as UserIdentity[],
    requests,
    logs: (logs.data ?? []) as ActivityLog[],
  };
}

export interface EventWithCount extends EventRow {
  reservationCount: number;
}

export async function fetchEvents(): Promise<EventWithCount[]> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false, nullsFirst: false })
    .limit(100);
  const events = (data ?? []) as EventRow[];

  const counts = new Map<string, number>();
  if (events.length > 0) {
    const { data: reservations } = await supabase
      .from("event_reservations")
      .select("event_id")
      .in("event_id", events.map((e) => e.id));
    for (const row of reservations ?? []) {
      const eid = (row as { event_id: string | null }).event_id;
      if (eid) counts.set(eid, (counts.get(eid) ?? 0) + 1);
    }
  }

  return events.map((e) => ({ ...e, reservationCount: counts.get(e.id) ?? 0 }));
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
  let q = supabase.from("activity_logs").select("*", { count: "exact" }).order("occurred_at", { ascending: false });
  if (search) {
    const term = sanitizeSearchTerm(search);
    if (term) q = q.or(`activity_type.ilike.%${term}%,provider.ilike.%${term}%`);
  }
  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1);
  const { data, count } = await q;
  return { items: (data ?? []) as ActivityLog[], total: count ?? 0, page, pageSize };
}
