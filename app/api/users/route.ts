import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchUsers } from "@/lib/data";
import { USER_LABEL_TEXT, type UserLabel } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const labelParam = searchParams.get("label");
  const label = labelParam && labelParam in USER_LABEL_TEXT ? (labelParam as UserLabel) : undefined;
  const search = searchParams.get("search") ?? undefined;
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? "20") || 20;

  const result = await fetchUsers({ label, search, page, pageSize });
  return NextResponse.json(result);
}
