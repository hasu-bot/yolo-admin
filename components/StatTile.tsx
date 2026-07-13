import Link from "next/link";

export function StatTile({
  label,
  value,
  unit,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  unit?: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-neutral-500 dark:text-neutral-400">{unit}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </>
  );

  const baseClass = "rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-neutral-900";

  if (href) {
    return (
      <Link
        href={href}
        prefetch={false}
        className={`${baseClass} block transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5`}
      >
        {body}
      </Link>
    );
  }
  return <div className={baseClass}>{body}</div>;
}
