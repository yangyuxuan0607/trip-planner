/** 同一天內先按時間排序，沒時間的放最後；同一時間或都沒時間時用 order 決定順序 */
export function sortItineraryItems<T extends { startTime: string | null; order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = a.startTime ?? "99:99";
    const tb = b.startTime ?? "99:99";
    if (ta !== tb) return ta < tb ? -1 : 1;
    return a.order - b.order;
  });
}
