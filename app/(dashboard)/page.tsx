import Link from "next/link";
import { fetchDashboardStats } from "@/lib/data";
import { StatTile } from "@/components/StatTile";
import { StatusDonut } from "@/components/StatusDonut";
import { formatRelative } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await fetchDashboardStats();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">ダッシュボード</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="未対応" value={stats.newCount} unit="件" />
        <StatTile label="対応中" value={stats.inProgressCount} unit="件" />
        <StatTile label="完了（累計）" value={stats.completedCount} unit="件" />
        <StatTile label="今日のLINE登録" value={stats.todayLineSignups} unit="人" />
        <StatTile label="直近Discord連携" value={stats.recentLinkCodes.length} unit="件" hint="直近5件" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">依頼ステータス分布</h2>
          <StatusDonut
            counts={{
              new: stats.newCount,
              in_progress: stats.inProgressCount,
              completed: stats.completedCount,
              cancelled: stats.cancelledCount,
            }}
          />
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
          <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">直近の活動ログ</h2>
          {stats.recentLogs.length === 0 ? (
            <p className="text-sm text-neutral-400">まだログがありません</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentLogs.map((log) => (
                <li key={log.id} className="text-sm">
                  <p className="text-neutral-800 dark:text-neutral-200">{log.activity_type}</p>
                  <p className="text-xs text-neutral-400">
                    {log.provider ?? "system"} ・ {formatRelative(log.occurred_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/logs" className="mt-4 inline-block text-xs font-medium text-indigo-600 hover:underline">
            すべて見る →
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
        <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">直近のDiscord連携</h2>
        {stats.recentLinkCodes.length === 0 ? (
          <p className="text-sm text-neutral-400">まだ連携がありません</p>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {stats.recentLinkCodes.map((code) => (
              <li key={code.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">{code.code}</span>
                  {code.discord_username && (
                    <span className="ml-2 text-xs text-neutral-500">{code.discord_username}</span>
                  )}
                </div>
                <span className="text-xs text-neutral-400">
                  {code.used_at ? `連携済み ・ ${formatRelative(code.used_at)}` : `未使用 ・ ${formatRelative(code.created_at)}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
