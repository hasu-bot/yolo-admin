import { fetchEvents } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">イベント</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        yolo-platform の events テーブル一覧（読み取り専用）。MAGAZINE からの同期処理は別タスクで実装予定です。
      </p>

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              <th className="px-4 py-3 font-medium">イベント名</th>
              <th className="px-4 py-3 font-medium">開始</th>
              <th className="px-4 py-3 font-medium">終了</th>
              <th className="px-4 py-3 font-medium">場所</th>
              <th className="px-4 py-3 font-medium">定員</th>
              <th className="px-4 py-3 font-medium">予約数</th>
              <th className="px-4 py-3 font-medium">ソース</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100">{event.title}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{formatDateTime(event.starts_at)}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{formatDateTime(event.ends_at)}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{event.location_name ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{event.capacity ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{event.reservationCount}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{event.source ?? "-"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-neutral-400">
                  イベントはありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
