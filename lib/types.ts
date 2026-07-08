export type RequestStatus = "new" | "in_progress" | "completed" | "cancelled";

export const REQUEST_STATUSES: RequestStatus[] = ["new", "in_progress", "completed", "cancelled"];

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  new: "未対応",
  in_progress: "対応中",
  completed: "完了",
  cancelled: "キャンセル",
};

export type UserLabel = "line_registered" | "discord_member" | "letter_user" | "consultation_user";

export const USER_LABEL_TEXT: Record<UserLabel, string> = {
  line_registered: "LINE登録",
  discord_member: "Discordメンバー",
  letter_user: "Letter.利用者",
  consultation_user: "相談利用者",
};

export interface AppUser {
  id: string;
  display_name: string | null;
  email: string | null;
  labels: UserLabel[] | null;
  created_at: string;
  last_active_at: string | null;
}

export type IdentityProvider = "line" | "discord" | "letter" | "consultation" | "event";

export interface UserIdentity {
  id: string;
  user_id: string;
  provider: IdentityProvider;
  external_id: string;
  display_name: string | null;
  is_primary: boolean | null;
  linked_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  actor: string | null;
  action: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface EventRow {
  id: string;
  name: string;
  source: string | null;
  synced_at: string | null;
  item_count: number | null;
  status: string | null;
  created_at: string;
}

export interface EventReservation {
  id: string;
  event_id: string;
  user_id: string | null;
  status: string | null;
  created_at: string;
}

export interface FollowupEntry {
  kind: "add" | "change";
  message: string;
  created_at: string;
  actor?: string | null;
}

export interface LetterBooking {
  id: string;
  user_id: string | null;
  requester_name: string | null;
  title: string;
  status: RequestStatus;
  desired_datetime: string | null;
  shoot_content: string | null;
  notes: string | null;
  admin_memo: string | null;
  booking_data: { followups?: FollowupEntry[] } | null;
  created_at: string;
  updated_at: string;
}

export interface Consultation {
  id: string;
  user_id: string | null;
  requester_name: string | null;
  title: string;
  body: string | null;
  status: RequestStatus;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscordLinkCode {
  id: string;
  user_id: string | null;
  code: string;
  linked_at: string | null;
  created_at: string;
}

export type RequestKind = "letter_booking" | "consultation";

export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  letter_booking: "Letter.撮影依頼",
  consultation: "YOLO相談",
};

export interface UnifiedRequest {
  id: string;
  kind: RequestKind;
  title: string;
  requester_name: string | null;
  user_id: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  followupCount?: number;
}
