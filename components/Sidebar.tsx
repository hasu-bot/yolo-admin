"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "ダッシュボード" },
  { href: "/requests", label: "依頼一覧" },
  { href: "/users", label: "ユーザー管理" },
  { href: "/events", label: "イベント" },
  { href: "/logs", label: "活動ログ" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            onClick={onNavigate}
            className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
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
  );
}

function Brand() {
  return (
    <span className="flex items-center gap-2">
      <span className="inline-block h-7 w-7 rounded-full bg-indigo-600" />
      <span className="text-base font-semibold text-neutral-900 dark:text-neutral-50">YOLO Admin</span>
    </span>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 画面遷移が完了したらモバイルメニューを閉じる
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // メニュー展開中は背面のスクロールを止める
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* モバイル: 上部バー */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/10 bg-white px-4 py-3 lg:hidden dark:border-white/10 dark:bg-neutral-950">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* モバイル: ドロワー */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl dark:bg-neutral-950">
            <div className="flex items-center justify-between px-5 py-4">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="メニューを閉じる"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-4">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-black/10 px-5 py-4 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
              admin
            </div>
          </div>
        </div>
      )}

      {/* デスクトップ: 常設サイドバー */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-black/10 bg-white lg:sticky lg:top-0 lg:flex dark:border-white/10 dark:bg-neutral-950">
        <div className="px-5 py-5">
          <Brand />
        </div>
        <div className="flex-1">
          <NavLinks />
        </div>
        <div className="border-t border-black/10 px-5 py-4 text-sm text-neutral-500 dark:border-white/10 dark:text-neutral-400">
          admin
        </div>
      </aside>
    </>
  );
}
