import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

function isValidPassword(supplied: string, expected: string): boolean {
  const suppliedBuf = Buffer.from(supplied);
  const expectedBuf = Buffer.from(expected);
  if (suppliedBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(suppliedBuf, expectedBuf);
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="yolo-admin"' },
  });
}

export function proxy(request: NextRequest) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) {
    return unauthorized();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice("Basic ".length), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const suppliedPassword = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
    if (isValidPassword(suppliedPassword, expectedPassword)) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
