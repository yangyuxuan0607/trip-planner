import type { Locale } from "./locale";

type LocaleSuffix = "Zh" | "En" | "Ja";

const FALLBACK_ORDER: Record<Locale, LocaleSuffix[]> = {
  zh: ["Zh", "En", "Ja"],
  en: ["En", "Zh", "Ja"],
  ja: ["Ja", "Zh", "En"],
};

/**
 * 從一個有 `${field}Zh` / `${field}En` / `${field}Ja` 欄位的物件（例如 Prisma row）
 * 依目前語言挑對應欄位，該語言沒填就照 fallback 順序找下一個非空的版本。
 * 找不到任何版本回傳空字串。
 */
export function pickField(obj: Record<string, unknown>, field: string, locale: Locale): string {
  for (const suffix of FALLBACK_ORDER[locale]) {
    const value = obj[`${field}${suffix}`];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

export type LocalizedValue = { zh: string; en: string; ja: string };

/** 把三語欄位打包成 { zh, en, ja } 給表單元件用 */
export function toLocalizedValue(obj: Record<string, unknown>, field: string): LocalizedValue {
  return {
    zh: (obj[`${field}Zh`] as string | null) ?? "",
    en: (obj[`${field}En`] as string | null) ?? "",
    ja: (obj[`${field}Ja`] as string | null) ?? "",
  };
}

/** 把表單的 { zh, en, ja } 轉成寫入資料庫用的 `${field}Zh/En/Ja` 三個欄位（空字串轉 null） */
export function fromLocalizedValue(field: string, value: LocalizedValue): Record<string, string | null> {
  return {
    [`${field}Zh`]: value.zh.trim() || null,
    [`${field}En`]: value.en.trim() || null,
    [`${field}Ja`]: value.ja.trim() || null,
  };
}

/** 給操作記錄用：不管哪個語言，挑第一個非空的當作可讀名稱 */
export function firstNonEmpty(value: LocalizedValue): string {
  return value.zh.trim() || value.en.trim() || value.ja.trim();
}
