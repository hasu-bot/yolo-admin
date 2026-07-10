import { USER_LABEL_TEXT, type UserLabel } from "@/lib/types";

const LABEL_STYLE: Record<UserLabel, string> = {
  line_registered: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  discord_member: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  letter_user: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  consultation_user: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

const LABEL_SHORT: Record<UserLabel, string> = {
  line_registered: "LINE",
  discord_member: "Discord",
  letter_user: "Letter.",
  consultation_user: "相談",
};

export function UserLabelBadges({ labels }: { labels: UserLabel[] | null }) {
  if (!labels || labels.length === 0) {
    return <span className="text-xs text-neutral-400">-</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {labels.map((label) => (
        <span
          key={label}
          title={USER_LABEL_TEXT[label]}
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${LABEL_STYLE[label]}`}
        >
          {LABEL_SHORT[label]}
        </span>
      ))}
    </div>
  );
}
