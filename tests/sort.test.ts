import { describe, expect, it } from "vitest";
import { sortItineraryItems } from "@/lib/sort";

describe("sortItineraryItems", () => {
  it("orders items by start time ascending", () => {
    const items = [
      { id: "b", startTime: "15:00", order: 0 },
      { id: "a", startTime: "08:00", order: 0 },
    ];
    expect(sortItineraryItems(items).map((i) => i.id)).toEqual(["a", "b"]);
  });

  it("puts items without a start time last", () => {
    const items = [
      { id: "notime", startTime: null, order: 0 },
      { id: "morning", startTime: "08:00", order: 0 },
    ];
    expect(sortItineraryItems(items).map((i) => i.id)).toEqual(["morning", "notime"]);
  });

  it("uses order as a tiebreak for equal (or missing) start times", () => {
    const items = [
      { id: "second", startTime: null, order: 1 },
      { id: "first", startTime: null, order: 0 },
    ];
    expect(sortItineraryItems(items).map((i) => i.id)).toEqual(["first", "second"]);
  });
});
