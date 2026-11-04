import { Locale } from "@/lib/types";

/** A genre button on the hotel top page. Managed at /admin/genres. */
export interface Genre {
  tagId: string;
  label: Record<Locale, string>;
}

/** Used until supabase/migrations/202611040001_genres.sql has been applied,
 * and the list that migration starts the table with. */
export const DEFAULT_GENRES: Genre[] = [
  {
    tagId: "genghis-khan",
    label: {
      ja: "ジンギスカン",
      en: "Genghis Khan",
      "zh-CN": "成吉思汗烤肉",
      "zh-TW": "成吉思汗烤肉",
      ko: "징기스칸",
    },
  },
  {
    tagId: "seafood",
    label: { ja: "海鮮", en: "Seafood", "zh-CN": "海鲜", "zh-TW": "海鮮", ko: "해산물" },
  },
  {
    tagId: "yakiniku",
    label: { ja: "焼肉", en: "Yakiniku", "zh-CN": "烤肉", "zh-TW": "烤肉", ko: "야키니쿠" },
  },
  {
    tagId: "izakaya",
    label: { ja: "居酒屋", en: "Izakaya", "zh-CN": "居酒屋", "zh-TW": "居酒屋", ko: "이자카야" },
  },
  {
    tagId: "bar",
    label: { ja: "BAR", en: "Bar", "zh-CN": "酒吧", "zh-TW": "酒吧", ko: "바" },
  },
  {
    tagId: "washoku",
    label: {
      ja: "和食",
      en: "Japanese Cuisine",
      "zh-CN": "日本料理",
      "zh-TW": "日本料理",
      ko: "일식",
    },
  },
  {
    tagId: "ramen",
    label: { ja: "ラーメン", en: "Ramen", "zh-CN": "拉面", "zh-TW": "拉麵", ko: "라멘" },
  },
  {
    tagId: "soup-curry",
    label: {
      ja: "スープカレー",
      en: "Soup Curry",
      "zh-CN": "汤咖喱",
      "zh-TW": "湯咖哩",
      ko: "수프카레",
    },
  },
  {
    tagId: "cafe",
    label: { ja: "カフェ", en: "Cafe", "zh-CN": "咖啡馆", "zh-TW": "咖啡廳", ko: "카페" },
  },
];
