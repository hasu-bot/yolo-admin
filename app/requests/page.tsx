import Link from "next/link";
import { fetchRequests } from "@/lib/data";
import {
  CANONICAL_STATUSES,
  REQUEST_KIND_LABEL,
  STATUS_LABEL,
  type CanonicalStatus,
  type RequestKind,
} from "@/lib/types";
import { Pagination } from "@/components/Pagination";
import { formatDateTime } from "@/lib/format";
import { toQuery } from "@/lib/query";
import { RequestStatusForm } from "./RequestStatusForm";

export const dynamic = "force-dynamic";

const KIND_TABS: { value: RequestKind | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "letter_booking", label: "Letter.撮影依頼" },
  { value: "consultation", label: "YOLO相談" },
];

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const kind: RequestKind | "all" =
    params.kind === "letter_booking" || params.kind === "consultation" ? params.kind : "all";
  const status = CANONICAL_STATUSES.includes(params.status as CanonicalStatus)
    ? (params.status as CanonicalStatus)
    : undefined;
  const page = Number(params.page ?? "1") || 1;
  const pageSize = 10;

  const { items, total } = await fetchRequests({ kind, status, page, pageSize });

  const kindQuery: Record<string, string | undefined> = { kind: kind !== "all" ? kind : undefined };
  const statusQuery: Record<string, string | undefined> = { status };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">依頼一覧</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-black/10 bg-white p-1 text-sm dark:border-white/10 dark:bg-neutral-900">
          {KIND_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/requests?${new URLSearchParams(
                toQuery({ kind: tab.value !== "all" ? tab.value : undefined, ...statusQuery })
              ).toString()}`}
              prefetch={false}
              className={`rounded-md px-3 py-1.5 font-medium ${
                kind === tab.value
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 text-sm">
          <Link
            href={`/requests?${new URLSearchParams(toQuery(kindQuery)).toString()}`}
            prefetch={false}
            className={`rounded-md px-3 py-1.5 font-medium ${
              !status
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-black/10 text-neutral-600 dark:border-white/10 dark:text-neutral-400"
            }`}
          >
            すべてのステータス
          </Link>
          {CANONICAL_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/requests?${new URLSearchParams(toQuery({ ...kindQuery, status: s })).toString()}`}
              prefetch={false}
              className={`rounded-md px-3 py-1.5 font-medium ${
                status === s
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                  : "border border-black/10 text-neutral-600 dark:border-white/10 dark:text-neutral-400"
              }`}
            >
              {STATUS_LABEL[s]}
            </Link>
          ))}
        </div>
      </div>

      {/* モバイル: カード表示 */}
      <div className="space-y-3 md:hidden">
        {items.map((item) => (
          <div
            key={`${item.kind}-${item.id}`}
            className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-900"
          >
            <p className="text-xs text-neutral-400">{REQUEST_KIND_LABEL[item.kind]}</p>
            <Link
              href={`/requests/${item.id}?kind=${item.kind}`}
              prefetch={false}
              className="mt-1 block font-medium text-neutral-900 dark:text-neutral-100"
            >
              {item.title}
            </Link>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {item.requesterName ?? "依頼者不明"} ・ {formatDateTime(item.created_at)}
              {item.followupCount ? ` ・ 追加・変更 ${item.followupCount}件` : ""}
            </p>
            <div className="mt-3">
              <RequestStatusForm id={item.id} kind={item.kind} status={item.status} rawStatus={item.rawStatus} />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl border border-black/10 bg-white px-4 py-10 text-center text-sm text-neutral-400 dark:border-white/10 dark:bg-neutral-900">
            該当する依頼はありません
          </p>
        )}
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden overflow-x-auto rounded-xl border border-black/10 bg-white md:block dark:border-white/10 dark:bg-neutral-900">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              <th className="px-4 py-3 font-medium">種別</th>
              <th className="px-4 py-3 font-medium">タイトル</th>
              <th className="px-4 py-3 font-medium">依頼者</th>
              <th className="px-4 py-3 font-medium">ステータス</th>
              <th className="px-4 py-3 font-medium">更新履歴</th>
              <th className="px-4 py-3 font-medium">作成日</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((item) => (
              <tr key={`${item.kind}-${item.id}`}>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{REQUEST_KIND_LABEL[item.kind]}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/requests/${item.id}?kind=${item.kind}`}
                    prefetch={false}
                    className="font-medium text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
                  >
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{item.requesterName ?? "-"}</td>
                <td className="px-4 py-3">
                  <RequestStatusForm id={item.id} kind={item.kind} status={item.status} rawStatus={item.rawStatus} />
                </td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                  {item.followupCount ? `追加・変更 ${item.followupCount}件` : "-"}
                </td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{formatDateTime(item.created_at)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                  該当する依頼はありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        basePath="/requests"
        searchParams={{ ...toQuery(kindQuery), ...toQuery(statusQuery) }}
      />
    </div>
  );
}
