import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { draftItemsSchema, type DraftItem } from "./types";

const SYSTEM_PROMPT = `你是旅行行程解析助手。使用者會貼上一段中文（可能夾雜英文/日文）的旅行敘述，
你要把裡面提到的每一件具體行程拆成一筆一筆的物件，並「只」回傳一個 JSON 陣列，不要有任何其他文字或 markdown 標記。

每個物件的欄位：
- date: 字串 "YYYY-MM-DD" 或 null（沒提到日期就填 null；年份不確定就用今年）
- startTime: 字串 "HH:MM" 或 null
- endTime: 字串 "HH:MM" 或 null
- title: 簡短標題（10 字內為佳）
- category: 只能是 "TRANSPORT" | "SIGHT" | "FOOD" | "LODGING" | "SHOPPING" | "FREE" | "OTHER" 其中之一
- locationName: 地點名稱字串或 null
- note: 補充備註字串或 null
- cost: 數字（日圓金額，沒提到就 null）
- suggestPoll: boolean，如果這段話聽起來像是「還沒決定、要大家投票/討論」就填 true

只回傳 JSON 陣列本身。`;

export async function parseWithAI(text: string, referenceYear: number): Promise<DraftItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `參考年份：${referenceYear}\n\n${text}` }],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("AI response missing text block");

  const jsonMatch = block.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("AI response did not contain a JSON array");

  const parsed = JSON.parse(jsonMatch[0]);
  const result = draftItemsSchema.safeParse(parsed);
  if (!result.success) throw new Error(`AI response failed schema validation: ${result.error.message}`);

  return result.data;
}
