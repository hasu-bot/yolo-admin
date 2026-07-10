import { fetchEvents } from "@/lib/data";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await fetchEvents();

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">イベント</h1>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        <p className="font-medium">イベントの正本はYOLO MAGAZINEです。この画面では削除・編集できません。</p>
        <p className="mt-1 text-xs">
          MAGAZINE側で非公開・削除しても、現在の同期はイベントを自動削除せず「非公開」として扱います。platform側のイベントを直接削除した場合は、そのイベントの予約も一緒に削除されます。
        </p>
      </div>

      {/* モバイル: カード表示 */}
      <div className="space-y-3 md:hidden">
        {events.map((event) => (
          <div
            key={event.id}
            className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-900"
          >
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{event.title}</p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {formatDateTime(event.starts_at)}
              {event.ends_at ? ` 〜 ${formatDateTime(event.ends_at)}` : ""}
            </p>
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {event.location_name ?? "場所未定"} ・ 定員 {event.capacity ?? "-"} ・ 予約 {event.reservationCount}件
            </p>
          </div>
        ))}
        {events.length === 0 && (
          <p className="rounded-xl border border-black/10 bg-white px-4 py-10 text-center text-sm text-neutral-400 dark:border-white/10 dark:bg-neutral-900">
            イベントはありません
          </p>
        )}
      </div>

      {/* PC: テーブル表示 */}
      <div className="hidden overflow-x-auto rounded-xl border border-black/10 bg-white md:block dark:border-white/10 dark:bg-neutral-900">
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
