import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fetchRequests } from "@/lib/data";
import { REQUEST_STATUSES, type RequestKind, type RequestStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");
  const kindParam = searchParams.get("kind");
  const page = Number(searchParams.get("page") ?? "1") || 1;
  const pageSize = Number(searchParams.get("pageSize") ?? "10") || 10;

  const status = REQUEST_STATUSES.includes(statusParam as RequestStatus) ? (statusParam as RequestStatus) : undefined;
  const kind: RequestKind | "all" =
    kindParam === "letter_booking" || kindParam === "consultation" ? kindParam : "all";

  const result = await fetchRequests({ status, kind, page, pageSize });
  return NextResponse.json(result);
}
