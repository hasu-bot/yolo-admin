import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchRequestDetail, updateRequest } from "@/lib/data";
import { CANONICAL_STATUSES, type CanonicalStatus, type RequestKind } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseKind(value: unknown): RequestKind | null {
  return value === "letter_booking" || value === "consultation" ? value : null;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  const { id } = await ctx.params;
  const kind = parseKind(new URL(request.url).searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ error: "kind は letter_booking か consultation を指定してください" }, { status: 400 });
  }
  const detail = await fetchRequestDetail(kind, id);
  if (!detail) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(detail);
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/requests/[id]">) {
  const { id } = await ctx.params;
  const body = await request.json().catch(() => null);
  const kind = parseKind(body?.kind);
  if (!kind) {
    return NextResponse.json({ error: "kind は letter_booking か consultation を指定してください" }, { status: 400 });
  }

  const patch: { status?: CanonicalStatus; admin_memo?: string } = {};
  if (body?.status !== undefined) {
    if (!CANONICAL_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "不正な status です" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (body?.admin_memo !== undefined) {
    if (typeof body.admin_memo !== "string") {
      return NextResponse.json({ error: "admin_memo は文字列で指定してください" }, { status: 400 });
    }
    patch.admin_memo = body.admin_memo;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "更新項目がありません" }, { status: 400 });
  }

  const ok = await updateRequest(kind, id, patch);
  if (!ok) return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
