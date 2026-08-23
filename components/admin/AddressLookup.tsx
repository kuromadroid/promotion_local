"use client";

import { useState } from "react";

export function AddressLookup({
  latName,
  lngName,
}: {
  latName: string;
  lngName: string;
}) {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleLookup = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!address.trim()) return;
    // Capture synchronously — e.currentTarget becomes null after the event
    // finishes dispatching, so it can't be read after an `await`.
    const form = e.currentTarget.closest("form");
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "not found");

      const latInput = form?.querySelector<HTMLInputElement>(`[name="${latName}"]`);
      const lngInput = form?.querySelector<HTMLInputElement>(`[name="${lngName}"]`);
      if (latInput) latInput.value = String(data.lat);
      if (lngInput) lngInput.value = String(data.lon);

      setStatus("done");
      setMessage(`「${data.displayName}」の座標を取得しました。緯度経度を確認してください。`);
    } catch {
      setStatus("error");
      setMessage("住所が見つかりませんでした。表記を変えて再度お試しください(例: 番地まで含める)。");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-(--color-ink)">
        住所から検索(任意)
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="北海道札幌市中央区南3条西4丁目"
            className="flex-1 rounded-lg border border-(--color-line) px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-(--color-coral)"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={status === "loading"}
            className="shrink-0 rounded-lg bg-(--color-navy) px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-(--color-navy-deep) disabled:opacity-50"
          >
            {status === "loading" ? "検索中…" : "座標を取得"}
          </button>
        </div>
      </label>
      {message && (
        <p
          className={`mt-1.5 text-xs ${
            status === "error" ? "text-(--color-coral-deep)" : "text-(--color-ink-soft)"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
