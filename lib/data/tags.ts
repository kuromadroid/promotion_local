import { Tag } from "@/lib/types";

export const tags: Tag[] = [
  {
    id: "seafood",
    type: "cuisine",
    name: { ja: "海鮮", en: "Seafood", zh: "海鲜", ko: "해산물" },
  },
  {
    id: "sushi",
    type: "cuisine",
    name: { ja: "寿司", en: "Sushi", zh: "寿司", ko: "초밥" },
  },
  {
    id: "genghis-khan",
    type: "cuisine",
    name: { ja: "ジンギスカン", en: "Genghis Khan (Lamb BBQ)", zh: "成吉思汗烤肉", ko: "징기스칸" },
  },
  {
    id: "ramen",
    type: "cuisine",
    name: { ja: "ラーメン", en: "Ramen", zh: "拉面", ko: "라멘" },
  },
  {
    id: "izakaya",
    type: "cuisine",
    name: { ja: "居酒屋", en: "Izakaya", zh: "居酒屋", ko: "이자카야" },
  },
  {
    id: "private-room",
    type: "feature",
    name: { ja: "個室", en: "Private Room", zh: "包间", ko: "개별룸" },
  },
  {
    id: "late-night",
    type: "scene",
    name: { ja: "深夜営業", en: "Open Late", zh: "深夜营业", ko: "심야영업" },
  },
  {
    id: "card-ok",
    type: "payment",
    name: { ja: "カード可", en: "Cards Accepted", zh: "可刷卡", ko: "카드 가능" },
  },
  {
    id: "english-menu",
    type: "language",
    name: { ja: "英語メニュー", en: "English Menu", zh: "英文菜单", ko: "영어 메뉴" },
  },
  {
    id: "solo-friendly",
    type: "scene",
    name: { ja: "一人でも入りやすい", en: "Solo-Friendly", zh: "适合独自用餐", ko: "혼밥 가능" },
  },
];
