import { REQUEST_STATUS_LABEL, type RequestStatus } from "@/lib/types";

const STATUS_STYLE: Record<RequestStatus, { dot: string; bg: string; text: string }> = {
  new: { dot: "bg-[#d03b3b]", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-700 dark:text-red-300" },
  in_progress: {
    dot: "bg-[#fab219]",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-300",
  },
  completed: {
    dot: "bg-[#0ca30c]",
    bg: "bg-green-50 dark:bg-green-500/10",
    text: "text-green-700 dark:text-green-300",
  },
  cancelled: {
    dot: "bg-neutral-400",
    bg: "bg-neutral-100 dark:bg-white/5",
    text: "text-neutral-600 dark:text-neutral-400",
  },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {REQUEST_STATUS_LABEL[status]}
    </span>
  );
}
