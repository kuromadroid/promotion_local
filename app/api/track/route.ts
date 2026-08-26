import { NextRequest, NextResponse } from "next/server";
import {
  getIpFromHeaders,
  isAnalyticsEventName,
  normalizeSessionId,
  recordServerEvent,
  TrackInput,
} from "@/lib/serverAnalytics";

export async function POST(req: NextRequest) {
  let body: TrackInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!isAnalyticsEventName(body.eventName)) {
    return NextResponse.json({ error: "invalid eventName" }, { status: 400 });
  }
  if (!normalizeSessionId(body.sessionId)) {
    return NextResponse.json({ error: "valid sessionId required" }, { status: 400 });
  }

  try {
    const result = await recordServerEvent(body, getIpFromHeaders(req.headers));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "tracking failed" }, { status: 500 });
  }
}
