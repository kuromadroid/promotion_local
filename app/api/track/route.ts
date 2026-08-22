import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/adminClient";
import { AnalyticsEventName, Locale } from "@/lib/types";

/** Same IP performing the same action on the same target won't be recounted within this window. */
const DEDUP_WINDOW_MINUTES = 30;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

interface TrackBody {
  eventName: AnalyticsEventName;
  hotelId?: string;
  restaurantId?: string;
  areaId?: string;
  tagId?: string;
  language?: Locale;
  path?: string;
  meta?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  let body: TrackBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.eventName) {
    return NextResponse.json({ error: "eventName required" }, { status: 400 });
  }

  const ipHash = crypto.createHash("sha256").update(getClientIp(req)).digest("hex");
  const windowStart = new Date(Date.now() - DEDUP_WINDOW_MINUTES * 60 * 1000).toISOString();

  let dupQuery = supabaseAdmin
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .eq("event_name", body.eventName)
    .gte("occurred_at", windowStart);
  dupQuery = body.hotelId ? dupQuery.eq("hotel_id", body.hotelId) : dupQuery.is("hotel_id", null);
  dupQuery = body.restaurantId
    ? dupQuery.eq("restaurant_id", body.restaurantId)
    : dupQuery.is("restaurant_id", null);

  const { count, error: dupError } = await dupQuery;
  if (dupError) {
    return NextResponse.json({ error: dupError.message }, { status: 500 });
  }
  if ((count ?? 0) > 0) {
    return NextResponse.json({ skipped: true });
  }

  const { error } = await supabaseAdmin.from("events").insert({
    event_name: body.eventName,
    hotel_id: body.hotelId ?? null,
    restaurant_id: body.restaurantId ?? null,
    area_id: body.areaId ?? null,
    tag_id: body.tagId ?? null,
    language: body.language ?? null,
    path: body.path ?? null,
    ip_hash: ipHash,
    meta: body.meta ?? null,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
