import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchRequestDetail } from "@/lib/data";
import { REQUEST_KIND_LABEL, type RequestKind } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { RequestStatusForm } from "../RequestStatusForm";

export const dynamic = "force-dynamic";

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

  const isLetterBooking = detail.kind === "letter_booking";
  const followups = isLetterBooking ? (detail.booking_data?.followups ?? []) : [];
  const sortedFollowups = [...followups].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

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
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{detail.title}</h1>

            <dl className="mt-4 grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-neutral-400">依頼者</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{detail.requester_name ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">作成日時</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{formatDateTime(detail.created_at)}</dd>
              </div>
              <div>
                <dt className="text-neutral-400">最終更新</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{formatDateTime(detail.updated_at)}</dd>
              </div>
              {isLetterBooking && (
                <div>
                  <dt className="text-neutral-400">希望日時</dt>
                  <dd className="text-neutral-800 dark:text-neutral-200">{detail.desired_datetime ?? "-"}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 space-y-3 text-sm">
              {isLetterBooking ? (
                <>
                  <div>
                    <p className="text-neutral-400">撮影内容</p>
                    <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
                      {detail.shoot_content ?? "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400">その他要望</p>
                    <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{detail.notes ?? "-"}</p>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-neutral-400">相談内容</p>
                  <p className="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{detail.body ?? "-"}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">ステータス・メモ</h2>
            <RequestStatusForm
              id={detail.id}
              kind={detail.kind}
              status={detail.status}
              adminMemo={detail.admin_memo}
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
                  <p className="text-xs text-neutral-400">
                    {formatDateTime(entry.created_at)} {entry.actor ? `・${entry.actor}` : ""}
                  </p>
                  <p className="text-neutral-800 dark:text-neutral-200">
                    {entry.kind === "add" ? "追加: " : "変更: "}
                    {entry.message}
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
