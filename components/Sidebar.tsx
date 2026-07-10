"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/requests", label: "依頼一覧" },
  { href: "/users", label: "ユーザー管理" },
  { href: "/events", label: "イベント同期" },
  { href: "/logs", label: "活動ログ" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-black/10 bg-white dark:border-white/10 dark:bg-neutral-950">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="inline-block h-7 w-7 rounded-full bg-indigo-600" />
        <span className="text-base font-semibold text-neutral-900 dark:text-neutral-50">YOLO Admin</span>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                  : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-black/10 px-5 py-4 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
        admin
      </div>
    </aside>
  );
}
