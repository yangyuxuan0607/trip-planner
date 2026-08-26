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

  it("recognizes M.D and M/D shorthand dates", () => {
    const dot = parseRuleBased("我們之後9.2先去新宿吃飯一下", 2026);
    expect(dot[0].date).toBe("2026-09-02");
    expect(dot[0].title).not.toContain("9.2");

    const slash = parseRuleBased("9/2去新宿吃飯", 2026);
    expect(slash[0].date).toBe("2026-09-02");
  });

  it("does not misread a decimal duration as a date", () => {
    const items = parseRuleBased("大概走1.5小時", 2026);
    expect(items[0].date).toBeNull();
  });

  it("falls back to a short place name after 去/到 when there is no landmark suffix", () => {
    const items = parseRuleBased("我們之後9.2先去新宿吃飯一下，像投票看看吃烤魚還是燒烤", 2026);
    expect(items[0].locationName).toBe("新宿");
  });
});
