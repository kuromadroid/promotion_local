"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { TagPill } from "@/components/TagPill";
import { trackEvent } from "@/lib/analytics";

interface Option {
  id: string;
  name: string;
}

export function RestaurantFilters({
  hotelId,
  areas,
  cuisineTags,
  featureTags,
}: {
  hotelId: string;
  areas: Option[];
  cuisineTags: Option[];
  featureTags: Option[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedArea = searchParams.get("area") ?? "";
  const selectedTags = (searchParams.get("tags") ?? "")
    .split(",")
    .filter(Boolean);
  const sort = searchParams.get("sort") ?? "priority";
  const q = searchParams.get("q") ?? "";

  const pushParams = (next: URLSearchParams) => {
    router.push(`${pathname}?${next.toString()}`);
  };

  const setArea = (areaId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (selectedArea === areaId) {
      next.delete("area");
    } else {
      next.set("area", areaId);
      trackEvent({ eventName: "area_filter", hotelId, areaId });
    }
    pushParams(next);
  };

  const toggleTag = (tagId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const set = new Set(selectedTags);
    if (set.has(tagId)) {
      set.delete(tagId);
    } else {
      set.add(tagId);
      trackEvent({ eventName: "tag_filter", hotelId, tagId });
    }
    if (set.size > 0) {
      next.set("tags", Array.from(set).join(","));
    } else {
      next.delete("tags");
    }
    pushParams(next);
  };

  const setSort = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sort", value);
    pushParams(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    pushParams(next);
  };

  const hasFilters = selectedArea || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-(--color-line) bg-white px-3 py-2 text-sm outline-none focus:border-(--color-navy)"
        >
          <option value="priority">{t("sortPriority")}</option>
          <option value="distance">{t("sortDistance")}</option>
          <option value="price_asc">{t("sortPriceAsc")}</option>
          <option value="price_desc">{t("sortPriceDesc")}</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-medium text-(--color-coral-deep) hover:underline"
          >
            {t("clearFilters")}
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
          {t("area")}
        </p>
        <div className="flex flex-wrap gap-2">
          {areas.map((area) => (
            <TagPill
              key={area.id}
              label={area.name}
              active={selectedArea === area.id}
              onClick={() => setArea(area.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
          {t("cuisine")}
        </p>
        <div className="flex flex-wrap gap-2">
          {cuisineTags.map((tag) => (
            <TagPill
              key={tag.id}
              label={tag.name}
              active={selectedTags.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-(--color-ink-soft)">
          {t("features")}
        </p>
        <div className="flex flex-wrap gap-2">
          {featureTags.map((tag) => (
            <TagPill
              key={tag.id}
              label={tag.name}
              active={selectedTags.includes(tag.id)}
              onClick={() => toggleTag(tag.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
