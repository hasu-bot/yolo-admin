import Link from "next/link";
import { fetchUsers } from "@/lib/data";
import { USER_LABEL_TEXT, userDisplayName, type UserLabel } from "@/lib/types";
import { Pagination } from "@/components/Pagination";
import { UserLabelBadges } from "@/components/UserLabelBadges";
import { formatDateTime } from "@/lib/format";
import { toQuery } from "@/lib/query";

export const dynamic = "force-dynamic";

const LABEL_FILTERS = Object.entries(USER_LABEL_TEXT) as [UserLabel, string][];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ label?: string; search?: string; page?: string }>;
}) {
  const params = await searchParams;
  const label = params.label && params.label in USER_LABEL_TEXT ? (params.label as UserLabel) : undefined;
  const search = params.search?.trim() || undefined;
  const page = Number(params.page ?? "1") || 1;
  const pageSize = 20;

  const { items, total } = await fetchUsers({ label, search, page, pageSize });

  const labelQuery: Record<string, string | undefined> = { label };
  const searchQuery: Record<string, string | undefined> = { search };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">ユーザー管理</h1>
        <form action="/users" className="flex items-center gap-2">
          {label && <input type="hidden" name="label" value={label} />}
          <input
            type="text"
            name="search"
            defaultValue={search ?? ""}
            placeholder="名前・メール・Instagramで検索"
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

      <div className="flex flex-wrap gap-1 text-sm">
        <Link
          href={`/users?${new URLSearchParams(toQuery(searchQuery)).toString()}`}
          prefetch={false}
          className={`rounded-md px-3 py-1.5 font-medium ${
            !label
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "border border-black/10 text-neutral-600 dark:border-white/10 dark:text-neutral-400"
          }`}
        >
          すべて
        </Link>
        {LABEL_FILTERS.map(([value, text]) => (
          <Link
            key={value}
            href={`/users?${new URLSearchParams(toQuery({ ...searchQuery, label: value })).toString()}`}
            prefetch={false}
            className={`rounded-md px-3 py-1.5 font-medium ${
              label === value
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-black/10 text-neutral-600 dark:border-white/10 dark:text-neutral-400"
            }`}
          >
            {text}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              <th className="px-4 py-3 font-medium">名前</th>
              <th className="px-4 py-3 font-medium">ラベル</th>
              <th className="px-4 py-3 font-medium">地域</th>
              <th className="px-4 py-3 font-medium">登録日</th>
              <th className="px-4 py-3 font-medium">依頼数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <Link
                    href={`/users/${user.id}`}
                    prefetch={false}
                    className="font-medium text-neutral-900 hover:text-indigo-600 dark:text-neutral-100 dark:hover:text-indigo-400"
                  >
                    {userDisplayName(user)}
                  </Link>
                  <p className="text-xs text-neutral-400">{user.email ?? user.instagram ?? user.id.slice(0, 8)}</p>
                </td>
                <td className="px-4 py-3">
                  <UserLabelBadges labels={user.user_labels} />
                </td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{user.region ?? "-"}</td>
                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
                  {formatDateTime(user.registered_at)}
                </td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{user.requestCount}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-400">
                  該当するユーザーはいません
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
        basePath="/users"
        searchParams={{ ...toQuery(labelQuery), ...toQuery(searchQuery) }}
      />
    </div>
  );
}
