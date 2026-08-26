import { describe, expect, it } from "vitest";
import { parseRuleBased } from "@/lib/parser/ruleBased";

const SAMPLE =
  "9月12日早上8點東京站集合，坐新幹線去京都，大概13000日圓。中午去京都站附近吃飯，下午3點入住 XX Hotel。晚上想去燒肉或者壽司，可以投票。";

describe("parseRuleBased", () => {
  it("splits the sample paragraph into multiple drafts", () => {
    const items = parseRuleBased(SAMPLE, 2026);
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it("extracts date and time onto the first item", () => {
    const items = parseRuleBased(SAMPLE, 2026);
    expect(items[0].date).toBe("2026-09-12");
    expect(items[0].startTime).toBe("08:00");
  });

  it("detects the transport leg with its cost", () => {
    const items = parseRuleBased(SAMPLE, 2026);
    const transport = items.find((i) => i.category === "TRANSPORT");
    expect(transport).toBeTruthy();
    expect(transport?.cost).toBe(13000);
  });

  it("detects a lodging check-in item with the carried-over date", () => {
    const items = parseRuleBased(SAMPLE, 2026);
    const lodging = items.find((i) => i.category === "LODGING");
    expect(lodging).toBeTruthy();
    expect(lodging?.startTime).toBe("15:00");
    expect(lodging?.date).toBe("2026-09-12");
  });

  it("flags the dinner discussion as poll-worthy", () => {
    const items = parseRuleBased(SAMPLE, 2026);
    const dinner = items.find((i) => i.title.includes("燒肉") || i.note?.includes("燒肉"));
    expect(dinner?.suggestPoll).toBe(true);
  });

  it("returns an empty array for empty input", () => {
    expect(parseRuleBased("", 2026)).toEqual([]);
  });
});
