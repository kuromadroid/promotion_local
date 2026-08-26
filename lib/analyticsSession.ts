let memorySessionId: string | null = null;

function createSessionId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Anonymous ID scoped to the current browser tab/session. */
export function getAnalyticsSessionId() {
  if (memorySessionId) return memorySessionId;

  try {
    const stored = window.sessionStorage.getItem("sapporo_bites_session_id");
    if (stored) {
      memorySessionId = stored;
      return stored;
    }

    const created = createSessionId();
    window.sessionStorage.setItem("sapporo_bites_session_id", created);
    memorySessionId = created;
    return created;
  } catch {
    memorySessionId = createSessionId();
    return memorySessionId;
  }
}
