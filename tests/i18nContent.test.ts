import { describe, expect, it } from "vitest";
import { pickField, fromLocalizedValue, toLocalizedValue, firstNonEmpty } from "@/lib/i18n/content";

describe("pickField", () => {
  const row = { titleZh: "中文標題", titleEn: "English title", titleJa: null };

  it("returns the exact locale when present", () => {
    expect(pickField(row, "title", "zh")).toBe("中文標題");
    expect(pickField(row, "title", "en")).toBe("English title");
  });

  it("falls back to zh when the requested locale is missing", () => {
    expect(pickField(row, "title", "ja")).toBe("中文標題");
  });

  it("returns empty string when nothing is set", () => {
    expect(pickField({ titleZh: null, titleEn: null, titleJa: null }, "title", "en")).toBe("");
  });
});

describe("fromLocalizedValue / toLocalizedValue", () => {
  it("round-trips through empty-string-to-null conversion", () => {
    const data = fromLocalizedValue("title", { zh: "你好", en: "", ja: "  " });
    expect(data).toEqual({ titleZh: "你好", titleEn: null, titleJa: null });
    expect(toLocalizedValue(data, "title")).toEqual({ zh: "你好", en: "", ja: "" });
  });
});

describe("firstNonEmpty", () => {
  it("prefers zh, then en, then ja", () => {
    expect(firstNonEmpty({ zh: "", en: "hi", ja: "こんにちは" })).toBe("hi");
    expect(firstNonEmpty({ zh: "", en: "", ja: "こんにちは" })).toBe("こんにちは");
    expect(firstNonEmpty({ zh: "", en: "", ja: "" })).toBe("");
  });
});
