import type { DraftItem } from "./types";

const PERIOD_DEFAULT_HOUR: Record<string, number> = {
  凌晨: 5,
  早上: 8,
  上午: 9,
  中午: 12,
  下午: 15,
  傍晚: 18,
  晚上: 19,
  夜晚: 20,
  深夜: 23,
};
const PERIOD_ADD_IF_LOW = new Set(["下午", "傍晚", "晚上", "夜晚", "深夜"]);

const CATEGORY_KEYWORDS: Array<[DraftItem["category"], string[]]> = [
  ["LODGING", ["入住", "check in", "check-in", "退房", "飯店", "酒店", "旅館", "民宿", "hotel"]],
  [
    "TRANSPORT",
    ["新幹線", "地鐵", "電車", "公車", "巴士", "飛機", "航班", "機場", "計程車", "出租車", "坐車", "開車", "租車", "渡輪", "高鐵", "捷運"],
  ],
  ["FOOD", ["吃", "午餐", "晚餐", "早餐", "餐廳", "燒肉", "壽司", "拉麵", "居酒屋", "咖啡", "甜點", "美食", "小吃"]],
  ["SIGHT", ["參觀", "景點", "神社", "寺", "公園", "博物館", "展望台", "城", "樂園", "動物園", "水族館", "花園"]],
  ["SHOPPING", ["購物", "逛街", "商店街", "outlet", "免稅", "百貨", "藥妝"]],
  ["FREE", ["自由活動", "自由時間", "隨意", "放鬆"]],
];

const POLL_KEYWORDS = ["投票", "要不要", "大家決定", "再看看", "選一個", "看大家", "可以投票"];

const LOCATION_PATTERNS: RegExp[] = [
  /入住\s*([^\s，。！？,]{1,20})/,
  /(?:在|去|到|於)\s*([^\s，。！？,]{1,14}(?:站|城|寺|神社|公園|飯店|酒店|[Hh]otel|機場|港|塔|山|島|區|町|廟|樂園))/,
  /([^\s，。！？,]{1,14}(?:站|城|寺|神社|公園|飯店|酒店|[Hh]otel|機場|港|塔|山|島|區|町|廟|樂園))/,
  // 沒有上面那些地標字尾的短地名（例如「新宿」「涉谷」），靠後面接的動作詞或標點抓邊界
  /(?:去|到|在|於|于)([一-龥ぁ-んァ-ヶー]{2,4})(?=吃|喝|看|買|买|玩|逛|集合|出發|出发|走|休息|拍照|逛街|購物|购物|報到|报到|參觀|参观|[，,、。！？\s]|$)/,
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** 從片段擷取日期，回傳 "YYYY-MM-DD"，找不到回傳 null */
function extractDate(clause: string, referenceYear: number): string | null {
  const m = clause.match(/(\d{1,2})月(\d{1,2})日/);
  if (m) {
    const month = Number(m[1]);
    const day = Number(m[2]);
    return `${referenceYear}-${pad2(month)}-${pad2(day)}`;
  }
  const iso = clause.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${pad2(Number(iso[2]))}-${pad2(Number(iso[3]))}`;

  // "9.2" "9/2" 這種簡寫日期；排除接在小時/公里這類單位前面的小數，避免誤判
  const md = clause.match(
    /(?<!\d)(\d{1,2})[./](\d{1,2})(?!\d)(?!\s*(?:小時|小时|公里|分鐘|分钟|個月|个月|週|周|度|秒|米|公斤))/,
  );
  if (md) {
    const month = Number(md[1]);
    const day = Number(md[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${referenceYear}-${pad2(month)}-${pad2(day)}`;
    }
  }
  return null;
}

/** 從片段擷取時間，回傳 "HH:MM"，找不到回傳 null */
function extractTime(clause: string): string | null {
  const clock = clause.match(/(\d{1,2})[:：](\d{2})/);
  if (clock) return `${pad2(Number(clock[1]))}:${clock[2]}`;

  const period = clause.match(/(凌晨|早上|上午|中午|下午|傍晚|晚上|夜晚|深夜)(\d{1,2})?(?:[點点])?(半)?/);
  if (period) {
    const word = period[1];
    let hour = period[2] ? Number(period[2]) : PERIOD_DEFAULT_HOUR[word];
    if (period[2] && PERIOD_ADD_IF_LOW.has(word) && hour < 12) hour += 12;
    const minute = period[3] ? 30 : 0;
    return `${pad2(hour)}:${pad2(minute)}`;
  }

  const bare = clause.match(/(\d{1,2})[點点](半)?/);
  if (bare) {
    const hour = Number(bare[1]);
    const minute = bare[2] ? 30 : 0;
    return `${pad2(hour)}:${pad2(minute)}`;
  }
  return null;
}

function extractCost(clause: string): number | null {
  const m = clause.match(/(?:大概|約|約莫|大約)?\s*[¥￥]?\s*([0-9][0-9,]{1,8})\s*(?:日圓|日元|円|¥|￥|台幣|塊|元)/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function detectCategory(text: string): DraftItem["category"] {
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()))) return category;
  }
  return "OTHER";
}

function detectLocation(text: string): string | null {
  for (const pattern of LOCATION_PATTERNS) {
    const m = text.match(pattern);
    if (m) return m[1].trim();
  }
  return null;
}

function detectSuggestPoll(text: string): boolean {
  return POLL_KEYWORDS.some((kw) => text.includes(kw));
}

/** 把片段開頭的日期/時間字樣去掉，當作標題的起點 */
function stripLeadingMarkers(clause: string): string {
  return clause
    .replace(/\d{1,2}月\d{1,2}日/, "")
    .replace(/(?<!\d)\d{1,2}[./]\d{1,2}(?!\d)/, "")
    .replace(/(凌晨|早上|上午|中午|下午|傍晚|晚上|夜晚|深夜)\d{0,2}[點点]?半?/, "")
    .replace(/\d{1,2}[:：]\d{2}/, "")
    .replace(/\d{1,2}[點点]半?/, "")
    .trim()
    .replace(/^[，,、\s]+/, "");
}

type Draft = {
  date: string | null;
  startTime: string | null;
  title: string;
  notes: string[];
  cost: number | null;
};

function flush(draft: Draft | null, results: DraftItem[]) {
  if (!draft) return;
  const fullText = [draft.title, ...draft.notes].join(" ");
  results.push({
    date: draft.date,
    startTime: draft.startTime,
    endTime: null,
    title: draft.title || "行程",
    category: detectCategory(fullText),
    locationName: detectLocation(fullText),
    note: draft.notes.length > 0 ? draft.notes.join("，") : null,
    cost: draft.cost,
    suggestPoll: detectSuggestPoll(fullText),
  });
}

/**
 * Rule-based（規則式）長文解析器，不需要任何 API Key。
 * 策略：以句號/換行切成句子，句子內再以逗號切成片語；
 * 片語中出現「新的時間」就視為新的一筆行程，沒有時間的片語併入目前累積的項目。
 */
export function parseRuleBased(text: string, referenceYear: number = new Date().getFullYear()): DraftItem[] {
  const results: DraftItem[] = [];
  let globalDate: string | null = null;

  const sentences = text
    .split(/[。！？\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const sentence of sentences) {
    const clauses = sentence
      .split(/[，,、]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    let current: Draft | null = null;

    for (const clause of clauses) {
      const foundDate = extractDate(clause, referenceYear);
      if (foundDate) globalDate = foundDate;

      const foundTime = extractTime(clause);
      const foundCost = extractCost(clause);

      if (foundTime && (!current || current.startTime)) {
        flush(current, results);
        current = {
          date: globalDate,
          startTime: foundTime,
          title: stripLeadingMarkers(clause).slice(0, 60) || clause.slice(0, 60),
          notes: [],
          cost: foundCost,
        };
        continue;
      }

      if (!current) {
        current = {
          date: globalDate,
          startTime: foundTime,
          title: stripLeadingMarkers(clause).slice(0, 60) || clause.slice(0, 60),
          notes: [],
          cost: foundCost,
        };
        continue;
      }

      current.notes.push(clause);
      if (foundCost && current.cost == null) current.cost = foundCost;
      if (!current.date) current.date = globalDate;
    }

    flush(current, results);
  }

  return results;
}
