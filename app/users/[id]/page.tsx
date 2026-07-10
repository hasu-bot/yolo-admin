import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchUserDetail } from "@/lib/data";
import { REQUEST_KIND_LABEL, userDisplayName } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { UserLabelBadges } from "@/components/UserLabelBadges";
import { formatDateTime, formatRelative } from "@/lib/format";
import { activityDetail, activityLabel, providerLabel } from "@/lib/activity";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await fetchUserDetail(id);
  if (!detail) notFound();

  const { user, identities, requests, logs } = detail;

  return (
    <div className="space-y-4">
      <Link href="/users" className="text-sm text-indigo-600 hover:underline">
        ← 一覧に戻る
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{userDisplayName(user)}</h1>
            {user.full_name && user.nickname && <p className="text-sm text-neutral-500">{user.full_name}</p>}
            <p className="text-xs text-neutral-400">{user.id}</p>
            <div className="mt-3">
              <UserLabelBadges labels={user.user_labels} />
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-400">登録日</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{formatDateTime(user.registered_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">最終更新</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{formatRelative(user.updated_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">メール</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{user.email ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">電話</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{user.phone ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">Instagram</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{user.instagram ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">世代 / 地域</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">
                  {user.generation ?? "-"} / {user.region ?? "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">興味</dt>
                <dd className="text-right text-neutral-800 dark:text-neutral-200">
                  {user.interests.length > 0 ? user.interests.join("・") : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">依頼数</dt>
                <dd className="text-neutral-800 dark:text-neutral-200">{requests.length}件</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">連携アカウント</h2>
            {identities.length === 0 ? (
              <p className="text-sm text-neutral-400">連携がありません</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {identities.map((identity) => (
                  <li key={identity.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-neutral-800 dark:text-neutral-200">
                        {providerLabel(identity.provider)}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {identity.display_name ?? identity.provider_user_id}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400">{formatRelative(identity.linked_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">依頼・相談履歴</h2>
            {requests.length === 0 ? (
              <p className="text-sm text-neutral-400">履歴がありません</p>
            ) : (
              <ul className="divide-y divide-black/5 text-sm dark:divide-white/10">
                {requests.map((req) => (
                  <li key={`${req.kind}-${req.id}`} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/requests/${req.id}?kind=${req.kind}`}
                        prefetch={false}
                        className="truncate font-medium text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
                      >
                        {req.title}
                      </Link>
                      <p className="text-xs text-neutral-400">
                        {REQUEST_KIND_LABEL[req.kind]} ・ {formatDateTime(req.created_at)}
                      </p>
                    </div>
                    <StatusBadge status={req.status} rawStatus={req.rawStatus} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-neutral-900">
            <h2 className="mb-4 text-sm font-semibold text-neutral-700 dark:text-neutral-300">活動ログ</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-neutral-400">ログがありません</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {logs.map((log) => (
                  <li key={log.id}>
                    <p className="text-neutral-800 dark:text-neutral-200">
                      {activityLabel(log.activity_type)}
                      <span className="ml-2 text-xs text-neutral-400">{providerLabel(log.provider)}</span>
                    </p>
                    {activityDetail(log) && <p className="text-xs text-neutral-400">{activityDetail(log)}</p>}
                    <p className="text-xs text-neutral-400">{formatDateTime(log.occurred_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
