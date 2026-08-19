import { Area } from "@/lib/types";

export const areas: Area[] = [
  {
    id: "sapporo-station",
    displayOrder: 1,
    name: { ja: "札幌駅", en: "Sapporo Station", zh: "札幌站", ko: "삿포로역" },
  },
  {
    id: "odori-tanukikoji",
    displayOrder: 2,
    name: {
      ja: "大通・狸小路",
      en: "Odori / Tanukikoji",
      zh: "大通・狸小路",
      ko: "오도리・타누키코지",
    },
  },
  {
    id: "susukino",
    displayOrder: 3,
    name: { ja: "すすきの", en: "Susukino", zh: "薄野", ko: "스스키노" },
  },
  {
    id: "nakajima-park",
    displayOrder: 4,
    name: {
      ja: "中島公園",
      en: "Nakajima Park",
      zh: "中岛公园",
      ko: "나카지마공원",
    },
  },
];
