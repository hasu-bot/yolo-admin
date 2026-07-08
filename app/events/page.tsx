import { fetchEvents } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">イベント同期</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        MAGAZINE と同期されたイベント一覧（読み取り専用）。同期処理自体は別タスクで実装予定です。
      </p>

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">イベント名</th>
              <th className="px-4 py-3 font-medium">ソース</th>
              <th className="px-4 py-3 font-medium">同期日時</th>
              <th className="px-4 py-3 font-medium">件数</th>
              <th className="px-4 py-3 font-medium">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">{event.id}</td>
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{event.name}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{event.source ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                  {formatDateTime(event.synced_at)}
                </td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{event.item_count ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{event.status ?? "-"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-400">
                  同期済みのイベントはありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
