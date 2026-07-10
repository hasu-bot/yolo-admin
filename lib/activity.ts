import type { ActivityLog } from "./types";

const ACTIVITY_LABEL: Record<string, string> = {
  line_registration_completed: "LINE登録を完了",
  line_event_info_requested: "LINEでイベント情報を確認",
  line_news_requested: "LINEでお知らせを確認",
  discord_link_code_created: "Discord連携コードを発行",
  discord_link_completed: "Discord連携を完了",
  letter_line_identity_linked: "Letter.のLINEアカウントを連携",
  letter_booking_requested: "Letter.の撮影依頼を送信",
  letter_followup_message_received: "Letter.の追加・変更連絡を受信",
};

const PROVIDER_LABEL: Record<string, string> = {
  line: "YOLO公式LINE（移行前）",
  line_yolo: "YOLO公式LINE",
  line_letter: "Letter.公式LINE",
  discord: "Discord",
  letter: "Letter.",
  consultation: "YOLO相談",
  event: "イベント",
};

export function activityLabel(activityType: string): string {
  return ACTIVITY_LABEL[activityType] ?? `その他の操作（${activityType}）`;
}

export function providerLabel(provider: string | null): string {
  return provider ? (PROVIDER_LABEL[provider] ?? provider) : "システム";
}

export function activityDetail(log: Pick<ActivityLog, "activity_type" | "metadata">): string | null {
  if (log.activity_type === "discord_link_completed") {
    const name = log.metadata.discord_username;
    return typeof name === "string" && name ? `${name} と連携` : null;
  }
  return null;
}
