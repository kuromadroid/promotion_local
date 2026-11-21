import "server-only";
import crypto from "crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/adminClient";

// Tables: supabase/migrations/202611210001_admin_auth.sql
const COOKIE_NAME = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

// Password guessing limits, counted over the last ATTEMPT_WINDOW_MS.
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES_PER_IP = 5;
// Caps guessing spread over many IPs. An attacker can use it to keep the
// admin out for up to 10 minutes, which is better than letting guesses run.
const MAX_FAILURES_TOTAL = 30;

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Compares in constant time so response timing does not leak the password. */
function passwordMatches(input: string) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is not set");
  // Hashing first gives equal-length buffers, which timingSafeEqual needs.
  const a = crypto.createHash("sha256").update(input).digest();
  const b = crypto.createHash("sha256").update(password).digest();
  return crypto.timingSafeEqual(a, b);
}

async function clientIp() {
  const h = await headers();
  // On Vercel, x-forwarded-for is set by the platform, not the client.
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

export type LoginResult = "ok" | "invalid" | "locked";

/** Checks the password with rate limiting and, on success, starts a session. */
export async function attemptAdminLogin(password: string): Promise<LoginResult> {
  const ip = await clientIp();
  const since = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();

  const [perIp, total] = await Promise.all([
    supabaseAdmin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", since),
    supabaseAdmin
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .gte("attempted_at", since),
  ]);
  if (perIp.error) throw perIp.error;
  if (total.error) throw total.error;
  if ((perIp.count ?? 0) >= MAX_FAILURES_PER_IP || (total.count ?? 0) >= MAX_FAILURES_TOTAL) {
    return "locked";
  }

  if (!passwordMatches(password)) {
    const { error } = await supabaseAdmin.from("admin_login_attempts").insert({ ip });
    if (error) throw error;
    return "invalid";
  }

  await supabaseAdmin.from("admin_login_attempts").delete().eq("ip", ip);
  await createSession();
  await pruneExpired();
  return "ok";
}

async function createSession() {
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const { error } = await supabaseAdmin
    .from("admin_sessions")
    .insert({ token_hash: sha256(token), expires_at: expiresAt.toISOString() });
  if (error) throw error;

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

async function pruneExpired() {
  const now = new Date().toISOString();
  const day = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await Promise.all([
    supabaseAdmin.from("admin_sessions").delete().lt("expires_at", now),
    supabaseAdmin.from("admin_login_attempts").delete().lt("attempted_at", day),
  ]);
}

// cache(): one DB lookup per request even though the layout and each server
// action call requireAdmin().
export const isAdminAuthenticated = cache(async () => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const { data, error } = await supabaseAdmin
    .from("admin_sessions")
    .select("token_hash")
    .eq("token_hash", sha256(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return data !== null;
});

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function clearAdminSession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await supabaseAdmin.from("admin_sessions").delete().eq("token_hash", sha256(token));
  }
  store.delete(COOKIE_NAME);
}
