import { NextResponse } from "next/server";
import { fetchEvents } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await fetchEvents();
  return NextResponse.json({ items: events });
}
