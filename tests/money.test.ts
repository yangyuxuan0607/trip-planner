import { describe, expect, it } from "vitest";
import { splitEvenly, settle, formatCurrency } from "@/lib/money";

describe("splitEvenly", () => {
  it("splits evenly divisible amounts equally", () => {
    const shares = splitEvenly(3000, ["a", "b", "c"]);
    expect(shares).toEqual({ a: 1000, b: 1000, c: 1000 });
  });

  it("distributes the remainder to the first participants so the total matches exactly", () => {
    const shares = splitEvenly(2000, ["a", "b", "c"]);
    expect(shares.a + shares.b + shares.c).toBe(2000);
    expect(shares).toEqual({ a: 667, b: 667, c: 666 });
  });

  it("gives 100% to a single participant", () => {
    expect(splitEvenly(4500, ["a"])).toEqual({ a: 4500 });
  });

  it("handles two participants (partial group split)", () => {
    const shares = splitEvenly(3700, ["a", "b"]);
    expect(shares.a + shares.b).toBe(3700);
    expect(shares).toEqual({ a: 1850, b: 1850 });
  });
});

describe("settle", () => {
  it("produces no transfers when everyone is even", () => {
    expect(settle([{ userId: "a", balance: 0 }, { userId: "b", balance: 0 }])).toEqual([]);
  });

  it("computes a single transfer for a simple two-person debt", () => {
    const transfers = settle([
      { userId: "a", balance: 1000 },
      { userId: "b", balance: -1000 },
    ]);
    expect(transfers).toEqual([{ fromUserId: "b", toUserId: "a", amount: 1000 }]);
  });

  it("minimizes transfer count for a three-person case", () => {
    // a paid everything (39000), split evenly three ways -> a is owed 26000 net,
    // b and c each owe 13000.
    const transfers = settle([
      { userId: "a", balance: 26000 },
      { userId: "b", balance: -13000 },
      { userId: "c", balance: -13000 },
    ]);
    expect(transfers).toHaveLength(2);
    const total = transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBe(26000);
    expect(transfers.every((t) => t.toUserId === "a")).toBe(true);
  });

  it("settles a mixed multi-party ledger with the fewest transfers", () => {
    const transfers = settle([
      { userId: "a", balance: 500 },
      { userId: "b", balance: 700 },
      { userId: "c", balance: -1200 },
    ]);
    expect(transfers).toHaveLength(2);
    expect(transfers.every((t) => t.fromUserId === "c")).toBe(true);
    const total = transfers.reduce((sum, t) => sum + t.amount, 0);
    expect(total).toBe(1200);
  });
});

describe("formatCurrency", () => {
  it("formats JPY with thousands separators and no decimals", () => {
    expect(formatCurrency(13800)).toBe("￥13,800");
  });
});
