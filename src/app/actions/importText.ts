"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeLog } from "@/lib/activityLog";
import { parseFreeText, type DraftItem } from "@/lib/parser";
import { fromLocalizedValue, type LocalizedValue } from "@/lib/i18n/content";
import { ok, fail, type ActionResult } from "@/lib/actionResult";
import type { Category } from "@prisma/client";

export async function previewImportAction(text: string): Promise<ActionResult<{ items: DraftItem[]; usedAI: boolean }>> {
  await requireUser();
  if (!text.trim()) return fail("請先貼上文字");

  const trip = await prisma.trip.findFirst();
  const referenceYear = trip ? trip.startDate.getUTCFullYear() : new Date().getFullYear();
  const result = await parseFreeText(text, referenceYear);
  if (result.items.length === 0) return fail("沒有解析出任何行程，請確認文字內容或改用手動新增");
  return ok(result);
}

export type ImportItemPayload = {
  dayId: string;
  startTime: string | null;
  endTime: string | null;
  title: LocalizedValue;
  category: Category;
  locationName: LocalizedValue;
  note: LocalizedValue;
  cost: number | null;
};

export async function bulkImportItemsAction(items: ImportItemPayload[]): Promise<ActionResult<{ count: number }>> {
  const user = await requireUser();
  if (items.length === 0) return fail("沒有勾選任何行程");

  const dayIds = [...new Set(items.map((i) => i.dayId))];
  const days = await prisma.day.findMany({ where: { id: { in: dayIds } } });
  if (days.length !== dayIds.length) return fail("有行程對應到不存在的日期");

  const baseCounts = new Map<string, number>();
  for (const dayId of dayIds) {
    baseCounts.set(dayId, await prisma.itineraryItem.count({ where: { dayId } }));
  }
  const runningCounts = new Map<string, number>();

  const created = await prisma.$transaction(
    items.map((it) => {
      const already = runningCounts.get(it.dayId) ?? 0;
      runningCounts.set(it.dayId, already + 1);
      const order = (baseCounts.get(it.dayId) ?? 0) + already;
      return prisma.itineraryItem.create({
        data: {
          dayId: it.dayId,
          startTime: it.startTime,
          endTime: it.endTime,
          category: it.category,
          cost: it.cost,
          order,
          createdById: user.id,
          ...fromLocalizedValue("title", it.title),
          ...fromLocalizedValue("locationName", it.locationName),
          ...fromLocalizedValue("note", it.note),
        },
      });
    }),
  );

  const tripId = days[0].tripId;
  await writeLog({
    tripId,
    userId: user.id,
    action: "IMPORT_BULK",
    targetType: "ItineraryItem",
    targetName: `${created.length} 筆行程`,
    summary: `從長文批量匯入 ${created.length} 筆行程`,
  });

  revalidatePath("/");
  return ok({ count: created.length });
}
