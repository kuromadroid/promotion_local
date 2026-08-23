import Link from "next/link";
import { HorizontalScroll } from "@/components/HorizontalScroll";

type T = (key: string, vars?: Record<string, string | number>) => string;

export function SceneLinks({ hotelId, t }: { hotelId: string; t: T }) {
  const scenes: { emoji: string; label: string; href: string }[] = [
    { emoji: "🧳", label: t("sceneSolo"), href: `/h/${hotelId}/restaurants?tags=solo-friendly` },
    {
      emoji: "🐑",
      label: t("sceneSapporo"),
      href: `/h/${hotelId}/restaurants?tags=genghis-khan`,
    },
    { emoji: "🚶", label: t("sceneNear"), href: `/h/${hotelId}/restaurants?sort=distance` },
    { emoji: "🌙", label: t("sceneLateNight"), href: `/h/${hotelId}/restaurants?tags=late-night` },
    { emoji: "🥂", label: t("sceneCouple"), href: `/h/${hotelId}/restaurants?tags=private-room` },
    { emoji: "🍻", label: t("sceneGroup"), href: `/h/${hotelId}/restaurants?tags=izakaya` },
  ];

  return (
    <HorizontalScroll>
      {scenes.map((scene) => (
        <Link
          key={scene.label}
          href={scene.href}
          className="flex w-[132px] shrink-0 snap-start flex-col items-start gap-2 rounded-2xl border border-(--color-line) bg-white px-3.5 py-3 transition-colors hover:border-(--color-coral)"
        >
          <span className="text-xl">{scene.emoji}</span>
          <span className="text-sm font-bold leading-snug text-(--color-ink)">
            {scene.label}
          </span>
        </Link>
      ))}
    </HorizontalScroll>
  );
}
