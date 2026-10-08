import { Locale } from "@/lib/types";

/**
 * Turns the free-text opening_hours / closed_days that admins enter in Japanese
 * ("17:00〜翌1:00", "日曜定休") into a 12-hour AM/PM string written the way each
 * language naturally writes it. Parsing happens at display time, so every
 * existing restaurant row benefits without a data migration; anything the
 * parser doesn't recognise is passed through with only the known words swapped.
 */

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;
type WeekdayKanji = (typeof WEEKDAYS)[number];

const DAY_NAMES: Record<Exclude<Locale, "ja">, { short: string[]; long: string[] }> = {
  en: {
    short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    long: ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"],
  },
  ko: {
    short: ["일", "월", "화", "수", "목", "금", "토"],
    long: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
  },
  "zh-CN": {
    short: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    long: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  },
  "zh-TW": {
    short: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
    long: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
  },
};

const dayIndex = (kanji: string) => WEEKDAYS.indexOf(kanji as WeekdayKanji);

function normalize(raw: string) {
  return (
    raw
      // full-width digits / colon → ASCII
      .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
      .replace(/：/g, ":")
      // "17時30分" / "17時" → "17:30" / "17:00"
      .replace(/(\d{1,2})時(\d{1,2})分?/g, (_, h, m) => `${h}:${m.padStart(2, "0")}`)
      .replace(/(\d{1,2})時/g, "$1:00")
      .trim()
  );
}

// ---------------------------------------------------------------------------
// Times
// ---------------------------------------------------------------------------

/** A clock time as minutes past midnight; values ≥ 1440 mean "the next day". */
function formatClock(totalMinutes: number, locale: Locale) {
  const minutesInDay = totalMinutes % 1440;
  const h = Math.floor(minutesInDay / 60);
  const m = minutesInDay % 60;
  const mm = String(m).padStart(2, "0");
  const pm = h >= 12;
  const h12 = h % 12 || 12;

  switch (locale) {
    case "ja":
      // 午前0:00 / 午後0:30 — the 12-hour convention Japanese readers expect.
      return `${pm ? "午後" : "午前"}${h % 12}:${mm}`;
    case "ko":
      if (h === 0 && m === 0) return "자정";
      return `${pm ? "오후" : "오전"} ${h12}시${m ? ` ${m}분` : ""}`;
    case "zh-CN":
    case "zh-TW":
      if (h === 0) return `午夜12:${mm}`;
      if (h === 12) return `中午12:${mm}`;
      return `${pm ? "下午" : "上午"}${h12}:${mm}`;
    case "en":
    default:
      return `${h12}:${mm} ${pm ? "PM" : "AM"}`;
  }
}

const NEXT_DAY: Record<Locale, string> = {
  ja: "翌",
  en: "",
  ko: "다음 날 ",
  "zh-CN": "次日",
  "zh-TW": "隔日",
};

const RANGE_SEP: Record<Locale, string> = {
  ja: "〜",
  en: " – ",
  ko: " ~ ",
  "zh-CN": " – ",
  "zh-TW": " – ",
};

function formatRange(start: number, end: number, endMarkedNextDay: boolean, locale: Locale) {
  // "17:00〜24:00" ends at midnight the same night — no next-day marker for that.
  const isMidnight = end % 1440 === 0;
  const crossesMidnight = !isMidnight && (end >= 1440 || endMarkedNextDay || end < start);
  return `${formatClock(start, locale)}${RANGE_SEP[locale]}${crossesMidnight ? NEXT_DAY[locale] : ""}${formatClock(end, locale)}`;
}

const TIME = String.raw`(翌\s*)?(\d{1,2}):(\d{2})`;
const RANGE_RE = new RegExp(`${TIME}\\s*[〜～~\\-–—]\\s*${TIME}`, "g");
const SINGLE_TIME_RE = new RegExp(TIME, "g");

const toMinutes = (h: string, m: string, nextDay?: string) =>
  Number(h) * 60 + Number(m) + (nextDay ? 1440 : 0);

// ---------------------------------------------------------------------------
// Words that commonly appear alongside the times
// ---------------------------------------------------------------------------

type Phrases = Record<Exclude<Locale, "ja">, string>;

/** Ordered longest-first so e.g. 土日祝 wins over 祝. */
const PHRASES: [RegExp, Phrases][] = [
  [/ラストオーダー|\bL\.?O\.?(?![A-Za-z])/g, { en: "last order ", ko: "라스트 오더 ", "zh-CN": "最后点餐 ", "zh-TW": "最後點餐 " }],
  [/料理|フード/g, { en: "Food ", ko: "음식 ", "zh-CN": "餐点", "zh-TW": "餐點" }],
  [/ドリンク/g, { en: "Drinks ", ko: "음료 ", "zh-CN": "饮品", "zh-TW": "飲品" }],
  // One entry, so the 無休 inside the zh output 全年無休 isn't matched a second time.
  [/^(?:なし|無し)$|(?:年中)?無休/g, { en: "Open every day", ko: "연중무휴", "zh-CN": "全年无休", "zh-TW": "全年無休" }],
  [/年末年始/g, { en: "New Year holidays", ko: "연말연시", "zh-CN": "年末年初", "zh-TW": "年末年初" }],
  [/不定休/g, { en: "Irregular holidays", ko: "비정기 휴무", "zh-CN": "不定期休息", "zh-TW": "不定期公休" }],
  [/土日祝日?/g, { en: "Weekends & holidays", ko: "주말·공휴일", "zh-CN": "周末及节假日", "zh-TW": "週末及國定假日" }],
  [/土日/g, { en: "Weekends", ko: "주말", "zh-CN": "周末", "zh-TW": "週末" }],
  [/[（(]祝日?の場合は?翌日[)）]/g, { en: "(next day if a holiday)", ko: "(공휴일이면 다음 날 휴무)", "zh-CN": "（逢节假日顺延至次日）", "zh-TW": "（遇國定假日順延至隔日）" }],
  [/[（(]祝日?の場合は?営業[)）]/g, { en: "(open on holidays)", ko: "(공휴일은 영업)", "zh-CN": "（节假日照常营业）", "zh-TW": "（國定假日照常營業）" }],
  [/祝前日/g, { en: "Day before holidays", ko: "공휴일 전날", "zh-CN": "节假日前一天", "zh-TW": "國定假日前一天" }],
  [/祝日|祝/g, { en: "Holidays", ko: "공휴일", "zh-CN": "节假日", "zh-TW": "國定假日" }],
  [/平日/g, { en: "Weekdays", ko: "평일", "zh-CN": "工作日", "zh-TW": "平日" }],
  [/モーニング/g, { en: "Breakfast", ko: "아침", "zh-CN": "早餐", "zh-TW": "早餐" }],
  [/ランチ/g, { en: "Lunch", ko: "점심", "zh-CN": "午餐", "zh-TW": "午餐" }],
  [/ディナー/g, { en: "Dinner", ko: "저녁", "zh-CN": "晚餐", "zh-TW": "晚餐" }],
  [/定休日?|休業日?/g, { en: "Closed", ko: "휴무", "zh-CN": "休息", "zh-TW": "公休" }],
];

const DAY_RANGE_RE = /([日月火水木金土])(?:曜日?)?\s*[〜～~\-–]\s*([日月火水木金土])(?:曜日?)?/g;
const SINGLE_DAY_RE = /([日月火水木金土])曜日?/g;
// A weekday written as a lone kanji ("月・水 11:30〜", "日、祝日:", "（日）") — but not
// the 日 inside words like 祝日 / 翌日, hence the no-kanji/kana-neighbour guards.
const JP_CHAR = String.raw`\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}`;
const BARE_DAY_RE = new RegExp(`(?<![${JP_CHAR}])[日月火水木金土](?![${JP_CHAR}])`, "gu");
const LIST_BEFORE_RE = /[日月火水木金土][・、,]$/;
const LIST_AFTER_RE = /^[・、,][日月火水木金土일월화수목금토]/;
// "(LO30分前)" / "L.O.は閉店30分前"
const LO_BEFORE_CLOSE_RE = /(?:ラストオーダー|\bL\.?O\.?)\s*(?:は)?\s*(?:閉店)?\s*(\d+)\s*分前/g;

function translateWords(text: string, locale: Exclude<Locale, "ja">) {
  const names = DAY_NAMES[locale];
  let out = text.replace(DAY_RANGE_RE, (_, a, b) => {
    const from = names.short[dayIndex(a)];
    const to = names.short[dayIndex(b)];
    if (locale === "en") return `${from}–${to}`;
    if (locale === "ko") return `${from}~${to}`;
    return `${from}至${to}`;
  });
  out = out.replace(SINGLE_DAY_RE, (_, d) =>
    locale === "en" ? names.short[dayIndex(d)] : names.long[dayIndex(d)]
  );
  out = out.replace(BARE_DAY_RE, (d, offset: number, whole: string) => {
    const inList =
      LIST_BEFORE_RE.test(whole.slice(Math.max(0, offset - 2), offset)) ||
      LIST_AFTER_RE.test(whole.slice(offset + 1, offset + 3));
    return locale === "en" || inList ? names.short[dayIndex(d)] : names.long[dayIndex(d)];
  });
  out = out.replace(LO_BEFORE_CLOSE_RE, (_, min) =>
    ({
      en: `last order ${min} min before closing`,
      ko: `라스트 오더는 마감 ${min}분 전`,
      "zh-CN": `闭店前${min}分钟最后点餐`,
      "zh-TW": `打烊前${min}分鐘最後點餐`,
    })[locale]
  );
  for (const [re, phrases] of PHRASES) out = out.replace(re, phrases[locale]);

  if (locale === "en" || locale === "ko") {
    out = out
      .replace(/（/g, " (")
      .replace(/）/g, ")")
      .replace(/(\S)\(/g, "$1 (")
      .replace(/、/g, ", ")
      .replace(/・/g, locale === "en" ? ", " : "·")
      .replace(/[〜～]/g, locale === "en" ? "–" : "~");
  } else {
    out = out.replace(/・/g, "、").replace(/[〜～]/g, "–");
  }
  return out.replace(/\s{2,}/g, " ").replace(/\(\s+/g, "(").trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function formatOpeningHours(raw: string | undefined, locale: Locale) {
  if (!raw) return raw;
  let text = normalize(raw);

  // Ranges first (so both ends see each other), then any lone times like "L.O.22:30".
  // Formatted output is parked behind placeholders so the single-time pass can't re-match it.
  const formatted: string[] = [];
  const park = (s: string) => `\u0000${formatted.push(s) - 1}\u0000`;
  text = text.replace(RANGE_RE, (_, n1, h1, m1, n2, h2, m2) =>
    park(formatRange(toMinutes(h1, m1, n1), toMinutes(h2, m2, n2), Boolean(n2), locale))
  );
  text = text.replace(SINGLE_TIME_RE, (_, n, h, m) => {
    const minutes = toMinutes(h, m, n);
    return park(`${minutes >= 1440 && minutes % 1440 !== 0 ? NEXT_DAY[locale] : ""}${formatClock(minutes, locale)}`);
  });

  if (locale !== "ja") text = translateWords(text, locale);
  return text
    .replace(/\s*[/／]\s*/g, " / ")
    .replace(/\u0000(\d+)\u0000/g, (_, i) => formatted[Number(i)]);
}

export function formatClosedDays(raw: string | undefined, locale: Locale) {
  if (!raw || locale === "ja") return raw;
  const text = normalize(raw).replace(/\s+/g, "");

  // "日曜定休" / "毎週月・火曜日定休" / "日・祝休み" — a leading list of weekdays (+ holidays)
  // becomes a proper sentence; any trailing note ("（祝日の場合は翌日）") is translated
  // word-by-word, and anything else falls back to word-by-word entirely.
  const match = text.match(
    /^(?:毎週)?((?:[日月火水木金土]|曜日?|祝日?|[・、,/／])+?)(定休日?|休業日?|休み|休|(?=$|[（(]))(.*)$/
  );
  if (!match) return translateWords(text, locale);
  const [, list, , rest] = match;

  const days = [...new Set([...list.replace(/曜日?|祝日?/g, "").matchAll(/[日月火水木金土]/g)].map((m) => dayIndex(m[0])))];
  const holidays = /祝/.test(list);
  if (days.length === 0 && !holidays) return translateWords(text, locale);
  const names = DAY_NAMES[locale];
  const note = rest ? translateWords(rest, locale) : "";

  switch (locale) {
    case "en": {
      const parts = days.map((d) => names.long[d]);
      if (holidays) parts.push("public holidays");
      const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
      return `Closed ${list}${note ? ` ${note}` : ""}`;
    }
    case "ko": {
      // 매주 일요일 휴무 / 매주 월·화요일 휴무 / 매주 일요일·공휴일 휴무
      const dayPart =
        days.length === 0
          ? ""
          : days.length === 1
            ? names.long[days[0]]
            : `${days.map((d) => names.short[d]).join("·")}요일`;
      const parts = [dayPart, holidays ? "공휴일" : ""].filter(Boolean).join("·");
      return `${days.length > 0 ? "매주 " : ""}${parts} 휴무${note ? ` ${note}` : ""}`;
    }
    case "zh-CN":
    case "zh-TW": {
      const dayPart = days.map((d) => names.long[d]).join("、");
      const holidayWord = locale === "zh-CN" ? "节假日" : "國定假日";
      const parts = [dayPart, holidays ? holidayWord : ""].filter(Boolean).join("及");
      return `${days.length > 0 ? "每" : ""}${parts}${locale === "zh-CN" ? "休息" : "公休"}${note}`;
    }
  }
}
