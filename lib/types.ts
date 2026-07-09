// yolo-platform Supabase の実スキーマ（2026-07-09 ダンプ確認済み）に基づく型定義。
// スキーマの正本は supabase/schema.sql。

/**
 * 管理画面上の正準ステータス（表示・フィルタ用）。
 * DB上の実値はアプリごとに語彙が異なるため、normalizeStatus() で正準化し、
 * 書き込み時は STATUS_WRITE_VALUE でアプリ側の語彙に合わせる。
 * - letter_bookings（Letter.）: requested / in_progress / completed / cancelled
 * - consultations（yolo-soudan）: pending / in_progress / done（+ cancelled）
 */
export type CanonicalStatus = "new" | "in_progress" | "completed" | "cancelled";

export const CANONICAL_STATUSES: CanonicalStatus[] = ["new", "in_progress", "completed", "cancelled"];

export const STATUS_LABEL: Record<CanonicalStatus, string> = {
  new: "未対応",
  in_progress: "対応中",
  completed: "完了",
  cancelled: "キャンセル",
};

const STATUS_ALIASES: Record<string, CanonicalStatus> = {
  new: "new",
  pending: "new",
  requested: "new",
  waiting: "new",
  in_progress: "in_progress",
  completed: "completed",
  done: "completed",
  resolved: "completed",
  cancelled: "cancelled",
  canceled: "cancelled",
};

/** DB上の実ステータス値を正準ステータスへ。未知の値は null（生値のまま表示する）。 */
export function normalizeStatus(raw: string | null | undefined): CanonicalStatus | null {
  if (!raw) return null;
  return STATUS_ALIASES[raw] ?? null;
}

export type RequestKind = "letter_booking" | "consultation";

/** 正準ステータス → 各テーブルに書き込む実値 */
export const STATUS_WRITE_VALUE: Record<RequestKind, Record<CanonicalStatus, string>> = {
  letter_booking: {
    new: "requested",
    in_progress: "in_progress",
    completed: "completed",
    cancelled: "cancelled",
  },
  consultation: {
    new: "pending",
    in_progress: "in_progress",
    completed: "done",
    cancelled: "cancelled",
  },
};

export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  letter_booking: "Letter.撮影依頼",
  consultation: "YOLO相談",
};

export type UserLabel = "line_registered" | "discord_member" | "letter_user" | "consultation_user";

export const USER_LABEL_TEXT: Record<UserLabel, string> = {
  line_registered: "LINE登録",
  discord_member: "Discordメンバー",
  letter_user: "Letter.利用者",
  consultation_user: "相談利用者",
};

// ---- テーブル行型（実スキーマ準拠） ----

export interface AppUser {
  id: string;
  full_name: string | null;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  generation: string | null;
  region: string | null;
  interests: string[];
  user_labels: UserLabel[];
  registered_at: string;
  created_at: string;
  updated_at: string;
}

export function userDisplayName(user: Pick<AppUser, "nickname" | "full_name" | "id">): string {
  return user.nickname ?? user.full_name ?? user.id.slice(0, 8);
}

export interface UserIdentity {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  display_name: string | null;
  linked_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  provider: string | null;
  provider_user_id: string | null;
  activity_type: string;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

export interface EventRow {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  location_name: string | null;
  capacity: number | null;
  source: string | null;
  source_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FollowupEntry {
  kind: "add" | "change";
  message?: string;
  text?: string;
  created_at?: string;
  at?: string;
}

export interface LetterBooking {
  id: string;
  user_id: string | null;
  source_submission_id: string | null;
  status: string;
  booking_data: Record<string, unknown> & { followups?: FollowupEntry[]; admin_memo?: string };
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  title: string;
  detail: string;
  category: string | null;
  urgency: string | null;
  nickname: string | null;
  contact: string | null;
  is_anonymous: boolean | null;
  file_urls: string[] | null;
  status: string;
  discord_message_id: string | null;
  yolo_user_id: string | null;
  is_read: boolean;
  admin_memo: string | null;
  request_type: string | null;
  schedule: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscordLinkCode {
  id: string;
  user_id: string;
  code: string;
  expires_at: string;
  used_at: string | null;
  discord_user_id: string | null;
  discord_username: string | null;
  created_at: string;
}

/** letter_bookings.booking_data からタイトル相当を推測する（Letter.側のキーは非公開のため代表キーを順に見る） */
export function bookingTitle(booking: Pick<LetterBooking, "booking_data" | "source_submission_id" | "id">): string {
  const data = booking.booking_data ?? {};
  for (const key of ["title", "subject", "shoot_content", "summary", "request", "content"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim().length > 60 ? `${value.trim().slice(0, 60)}…` : value.trim();
    }
  }
  return `撮影依頼 ${booking.source_submission_id ?? booking.id.slice(0, 8)}`;
}

/** 依頼一覧の統合表示用 */
export interface UnifiedRequest {
  id: string;
  kind: RequestKind;
  title: string;
  requesterName: string | null;
  userId: string | null;
  rawStatus: string;
  status: CanonicalStatus | null;
  followupCount: number;
  created_at: string;
  updated_at: string;
}
