import { fetchActivityLogs } from "@/lib/data";
import { Pagination } from "@/components/Pagination";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.search?.trim() || undefined;
  const page = Number(params.page ?? "1") || 1;
  const pageSize = 30;

  const { items, total } = await fetchActivityLogs({ search, page, pageSize });
  const searchQuery = search ? { search } : {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">活動ログ</h1>
        <form action="/logs" className="flex items-center gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="種別・プロバイダで検索"
            className="w-64 rounded-md border border-black/10 bg-white px-3 py-1.5 text-sm dark:border-white/10 dark:bg-neutral-900"
          />
          <button
            type="submit"
            className="rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:border-white/10 dark:text-neutral-400 dark:hover:bg-white/5"
          >
            検索
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              <th className="px-4 py-3 font-medium">日時</th>
              <th className="px-4 py-3 font-medium">種別</th>
              <th className="px-4 py-3 font-medium">プロバイダ</th>
              <th className="px-4 py-3 font-medium">ユーザー</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((log) => (
              <tr key={log.id}>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{formatDateTime(log.occurred_at)}</td>
                <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{log.activity_type}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{log.provider ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                  {log.user_id ? (
                    <Link href={`/users/${log.user_id}`} className="text-indigo-600 hover:underline">
                      {log.user_id.slice(0, 8)}…
                    </Link>
                  ) : (
                    (log.provider_user_id ?? "-")
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-400">
                  ログがありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={pageSize} total={total} basePath="/logs" searchParams={searchQuery} />
    </div>
  );
}
