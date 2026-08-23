import { NextRequest, NextResponse } from "next/server";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Free geocoding via OpenStreetMap Nominatim — no API key required.
 * Server-side proxy (not called directly from the browser) so we can set
 * a proper User-Agent, as required by Nominatim's usage policy.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "1");

  const res = await fetch(url, {
    headers: {
      "User-Agent": "SapporoBitesAdmin/1.0 (internal hotel-guide admin tool)",
      "Accept-Language": "ja",
    },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "geocoding service unavailable" }, { status: 502 });
  }

  const results = (await res.json()) as NominatimResult[];
  if (results.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const [first] = results;
  return NextResponse.json({
    lat: Number(first.lat),
    lon: Number(first.lon),
    displayName: first.display_name,
  });
}
