import { REQUEST_STATUS_LABEL, REQUEST_STATUSES, type RequestStatus } from "@/lib/types";

const STATUS_COLOR: Record<RequestStatus, string> = {
  new: "#d03b3b",
  in_progress: "#fab219",
  completed: "#0ca30c",
  cancelled: "#9a9890",
};

export function StatusDonut({ counts }: { counts: Record<RequestStatus, number> }) {
  const total = REQUEST_STATUSES.reduce((sum, s) => sum + counts[s], 0);
  const size = 176;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = total > 0 ? 3 : 0;

  let offset = 0;
  const segments = REQUEST_STATUSES.filter((s) => counts[s] > 0).map((status) => {
    const value = counts[status];
    const length = (value / total) * circumference;
    const dash = Math.max(length - gap, 0);
    const dashOffset = -offset;
    offset += length;
    return { status, dashArray: `${dash} ${circumference - dash}`, dashOffset };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-neutral-100 dark:text-white/10"
            strokeWidth={strokeWidth}
          />
          {total > 0 &&
            segments.map((segment) => (
              <circle
                key={segment.status}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={STATUS_COLOR[segment.status]}
                strokeWidth={strokeWidth}
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="butt"
              />
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">合計</span>
          <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">{total}</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">件</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {REQUEST_STATUSES.map((status) => {
          const value = counts[status];
          const pct = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <li key={status} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[status] }} />
              <span className="text-neutral-700 dark:text-neutral-300">{REQUEST_STATUS_LABEL[status]}</span>
              <span className="text-neutral-500 dark:text-neutral-400">
                {value}（{pct}%）
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
