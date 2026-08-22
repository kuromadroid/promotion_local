import { NextRequest, NextResponse } from "next/server";
import { getIpFromHeaders, recordServerEvent, TrackInput } from "@/lib/serverAnalytics";

export async function POST(req: NextRequest) {
  let body: TrackInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.eventName) {
    return NextResponse.json({ error: "eventName required" }, { status: 400 });
  }

  try {
    const result = await recordServerEvent(body, getIpFromHeaders(req.headers));
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
