import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchRequestDetail } from "@/lib/data";
import {
  bookingTitle,
  normalizeStatus,
  REQUEST_KIND_LABEL,
  type FollowupEntry,
  type RequestKind,
} from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { htmlToPlainText } from "@/lib/text";
import { RequestStatusForm } from "../RequestStatusForm";

export const dynamic = "force-dynamic";

/** booking_data のうち、専用UIで扱うキー（一覧化から除外する） */
const HANDLED_BOOKING_KEYS = new Set(["followups", "admin_memo"]);

/** 表示順も兼ねる。ここに無いキーはこの後ろに続く */
const BOOKING_KEY_LABEL: Record<string, string> = {
  title: "タイトル",
  subject: "件名",
  request: "依頼内容",
  content: "内容",
  shoot_content: "撮影内容",
  summary: "概要",
  desired_dates: "希望日候補",
  desired_datetime: "希望日時",
  schedule: "希望時期",
  location: "場所",
  budget: "予算",
  people: "人数",
  purpose: "用途",
  name: "お名前",
  contact: "連絡先",
  notes: "その他要望",
  message: "メッセージ",
  answers: "回答内容",
};

/** 運営が普段見る必要のない技術的なキーは折りたたみに逃がす */
const TECHNICAL_KEY_PATTERN = /(^|_)(id|ids|token|uid|hash|signature|raw|payload)$|^(source|line_user|discord_user)/i;

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) return true;
  return false;
}

function toDisplayText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return htmlToPlainText(value);
  if (typeof value === "boolean") return value ? "はい" : "いいえ";
  if (Array.isArray(value)) return value.map((v) => toDisplayText(v)).join("\n");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => !isEmptyValue(v))
      .map(([k, v]) => `${BOOKING_KEY_LABEL[k] ?? k}: ${toDisplayText(v)}`)
      .join("\n");
  }
  return String(value);
}

/** メール・URLはタップできるように */
function ContactText({ value }: { value: string }) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return (
      <a href={`mailto:${value}`} className="text-indigo-600 hover:underline">
        {value}
      </a>
    );
  }
  if (/^https?:\/\//.test(value)) {
    return (
      <a href={value} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
        {value}
      </a>
    );
  }
  return <>{value}</>;
}

function sortBookingEntries(entries: [string, unknown][]): [string, unknown][] {
  const order = Object.keys(BOOKING_KEY_LABEL);
  return [...entries].sort(([a], [b]) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return 0;
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function followupText(entry: FollowupEntry): string {
  return htmlToPlainText(entry.message ?? entry.text ?? "");
}

function followupAt(entry: FollowupEntry): string | undefined {
  return entry.created_at ?? entry.at;
}

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { id } = await params;
  const { kind: kindParam } = await searchParams;
  const kind: RequestKind = kindParam === "consultation" ? "consultation" : "letter_booking";

  const detail = await fetchRequestDetail(kind, id);
  if (!detail) notFound();

  const isBooking = detail.kind === "letter_booking";
  const title = isBooking ? htmlToPlainText(bookingTitle(detail.row)) : detail.row.title;
  const status = normalizeStatus(detail.row.status);
  const adminMemo = isBooking ? (detail.row.booking_data?.admin_memo ?? null) : detail.row.admin_memo;

  const followups: FollowupEntry[] = isBooking ? (detail.row.booking_data?.followups ?? []) : [];
  const sortedFollowups = [...followups].sort((a, b) => ((followupAt(a) ?? "") < (followupAt(b) ?? "") ? 1 : -1));

  const allEntries = isBooking
    ? Object.entries(detail.row.booking_data ?? {}).filter(
        ([key, value]) => !HANDLED_BOOKING_KEYS.has(key) && !isEmptyValue(value)
      )
    : [];
  const mainEntries = sortBookingEntries(allEntries.filter(([key]) => !TECHNICAL_KEY_PATTERN.test(key)));
  const technicalEntries = allEntries.filter(([key]) => TECHNICAL_KEY_PATTERN.test(key));

  const detailUserId = detail.kind === "letter_booking" ? detail.row.user_id : detail.row.yolo_user_id;

  return (
    <div className="space-y-4">
      <Link href="/requests" className="text-sm text-indigo-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
            <span className="mb-2 inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 dark:bg-white/5 dark:text-neutral-400">
              {REQUEST_KIND_LABEL[detail.kind]}
            </span>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{title}</h1>

            <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-neutral-400">依頼者</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">
                  {detail.requesterName ?? "-"}
                  {detailUserId && (
                    <Link
                      href={`/users/${detailUserId}`}
                      prefetch={false}
                      className="ml-2 text-xs text-indigo-600 hover:underline"
                    >
                      詳細
                    </Link>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400">作成日時</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{formatDateTime(detail.row.created_at)}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">最終更新</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{formatDateTime(detail.row.updated_at)}</dd>
              </div>
            </dl>

            {detail.kind === "consultation" ? (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-neutral-400">相談内容</p>
                  <p className="whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200">
                    {htmlToPlainText(detail.row.detail)}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-y-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-neutral-400">カテゴリ</dt>
                    <dd className="text-neutral-800 dark:text-neutral-200">{detail.row.category ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">緊急度</dt>
                    <dd className="text-neutral-800 dark:text-neutral-200">{detail.row.urgency ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">希望時期</dt>
                    <dd className="text-neutral-800 dark:text-neutral-200">{detail.row.schedule ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">種別</dt>
                    <dd className="text-neutral-800 dark:text-neutral-200">{detail.row.request_type ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">連絡先</dt>
                    <dd className="text-neutral-800 dark:text-neutral-200">
                      {detail.row.is_anonymous ? (
                        "（匿名）"
                      ) : detail.row.contact ? (
                        <ContactText value={detail.row.contact} />
                      ) : (
                        "-"
                      )}
                    </dd>
                  </div>
                </dl>
                {(detail.row.file_urls?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-neutral-400">添付ファイル</p>
                    <ul className="list-inside list-disc">
                      {detail.row.file_urls!.map((url) => (
                        <li key={url}>
                          <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                            {url.split("/").pop()}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                {mainEntries.length === 0 && technicalEntries.length === 0 ? (
                  <p className="text-neutral-400">依頼内容の詳細データがありません</p>
                ) : (
                  <>
                    <dl className="space-y-3">
                      {mainEntries.map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-neutral-400">{BOOKING_KEY_LABEL[key] ?? key}</dt>
                          <dd className="whitespace-pre-wrap leading-relaxed text-neutral-800 dark:text-neutral-200">
                            {key === "contact" && typeof value === "string" ? (
                              <ContactText value={value} />
                            ) : (
                              toDisplayText(value)
                            )}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    {technicalEntries.length > 0 && (
                      <details className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/10">
                        <summary className="cursor-pointer text-xs text-neutral-400">
                          技術情報（{technicalEntries.length}件）
                        </summary>
                        <dl className="mt-2 space-y-2">
                          {technicalEntries.map(([key, value]) => (
                            <div key={key}>
                              <dt className="text-xs text-neutral-400">{key}</dt>
                              <dd className="break-all font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                {toDisplayText(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </details>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">ステータス・メモ</h2>
            <RequestStatusForm
              id={detail.row.id}
              kind={detail.kind}
              status={status}
              rawStatus={detail.row.status}
              adminMemo={typeof adminMemo === "string" ? adminMemo : null}
              showMemo
            />
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">追加・変更履歴</h2>
          {sortedFollowups.length === 0 ? (
            <p className="text-sm text-neutral-400">履歴はありません</p>
          ) : (
            <ol className="space-y-4 border-l border-black/10 pl-4 dark:border-white/10">
              {sortedFollowups.map((entry, index) => (
                <li key={index} className="relative text-sm">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-indigo-500" />
                  <p className="text-xs text-neutral-400">{formatDateTime(followupAt(entry))}</p>
                  <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                    <span
                      className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                        entry.kind === "add"
                          ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      }`}
                    >
                      {entry.kind === "add" ? "追加" : "変更"}
                    </span>
                    {followupText(entry)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
