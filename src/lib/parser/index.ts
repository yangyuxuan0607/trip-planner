import "server-only";
import type { DraftItem } from "./types";
import { parseRuleBased } from "./ruleBased";
import { parseWithAI } from "./ai";

export type { DraftItem } from "./types";

export type ParseResult = {
  items: DraftItem[];
  usedAI: boolean;
};

/**
 * 統一的長文解析入口。
 * 有 ANTHROPIC_API_KEY 才會嘗試 AI 解析；失敗（沒 key、呼叫錯誤、回傳格式不符）一律
 * fallback 回 rule-based parser，保證一定有結果可以預覽。
 */
export async function parseFreeText(text: string, referenceYear: number = new Date().getFullYear()): Promise<ParseResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const items = await parseWithAI(text, referenceYear);
      if (items.length > 0) return { items, usedAI: true };
    } catch (err) {
      console.error("AI parse failed, falling back to rule-based parser:", err);
    }
  }
  return { items: parseRuleBased(text, referenceYear), usedAI: false };
}
