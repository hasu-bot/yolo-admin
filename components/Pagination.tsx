import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
      <span>
        全{total}件中 {start}-{end}件を表示
      </span>
      <div className="flex items-center gap-1">
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={`rounded-md px-2 py-1 ${
            page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          ← 前へ
        </Link>
        <span className="px-2">
          {page} / {totalPages}
        </span>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={`rounded-md px-2 py-1 ${
            page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-neutral-100 dark:hover:bg-white/5"
          }`}
        >
          次へ →
        </Link>
      </div>
    </div>
  );
}
