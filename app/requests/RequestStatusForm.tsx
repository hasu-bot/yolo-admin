"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { REQUEST_STATUSES, REQUEST_STATUS_LABEL, type RequestKind, type RequestStatus } from "@/lib/types";

export function RequestStatusForm({
  id,
  kind,
  status,
  adminMemo,
  showMemo = false,
}: {
  id: string;
  kind: RequestKind;
  status: RequestStatus;
  adminMemo?: string | null;
  showMemo?: boolean;
}) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [memo, setMemo] = useState(adminMemo ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submitPatch(patch: { status?: RequestStatus; admin_memo?: string }) {
    setError(null);
    setSaved(false);
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...patch }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "更新に失敗しました");
      return;
    }
    setSaved(true);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={currentStatus}
          onChange={(e) => {
            const next = e.target.value as RequestStatus;
            setCurrentStatus(next);
            submitPatch({ status: next });
          }}
          disabled={isPending}
          className="rounded-md border border-black/10 bg-white px-2 py-1.5 text-sm dark:border-white/10 dark:bg-neutral-900"
        >
          {REQUEST_STATUSES.map((s) => (
            <option key={s} value={s}>
              {REQUEST_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        {isPending && <span className="text-xs text-neutral-400">更新中…</span>}
      </div>

      {showMemo && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">管理者メモ</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            placeholder="メモを入力…"
            className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={() => submitPatch({ admin_memo: memo })}
            disabled={isPending}
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            保存
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
      {saved && !error && <p className="text-xs text-green-600">保存しました</p>}
    </div>
  );
}
