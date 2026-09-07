import { NextRequest, NextResponse } from "next/server";
import {
  getIpFromHeaders,
  isAnalyticsEventName,
  normalizeSessionId,
  recordServerEvent,
  TrackInput,
} from "@/lib/serverAnalytics";

// A well-formed tracking event is a few hundred bytes. Anything materially
// larger is either broken or hostile, so reject it before parsing JSON.
const MAX_BODY_BYTES = 4096;

export async function POST(req: NextRequest) {
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const body = parsed as TrackInput;
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
