import { NextRequest, NextResponse } from "next/server";
import {
  getIpFromHeaders,
  isAnalyticsEventName,
  normalizeSessionId,
  recordServerEvent,
  TrackInput,
} from "@/lib/serverAnalytics";

// A well-formed tracking event is a few hundred bytes. Anything materially
// larger is either broken or hostile, so stop reading once we pass this.
const MAX_BODY_BYTES = 4096;

/**
 * Read the request body while counting real bytes, and abort the stream the
 * moment it exceeds `limit` — we never buffer or decode more than that.
 * Returns null when the limit is exceeded.
 */
async function readBodyWithinLimit(
  stream: ReadableStream<Uint8Array> | null,
  limit: number
): Promise<string | null> {
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(buffer);
}

export async function POST(req: NextRequest) {
  // Cheap early reject for honest clients that send Content-Length.
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let raw: string | null;
  try {
    raw = await readBodyWithinLimit(req.body, MAX_BODY_BYTES);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  if (raw === null) {
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
