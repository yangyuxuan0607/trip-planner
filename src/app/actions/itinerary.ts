"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeLog } from "@/lib/activityLog";
import { itineraryInputSchema, type ItineraryInput } from "@/lib/validation/itinerary";
import { fieldErrorsOf } from "@/lib/validation/util";
import { fromLocalizedValue, firstNonEmpty } from "@/lib/i18n/content";
import { sortItineraryItems } from "@/lib/sort";
import { ok, fail, type ActionResult } from "@/lib/actionResult";

function toItineraryData(input: ItineraryInput) {
  return {
    dayId: input.dayId,
    startTime: input.startTime,
    endTime: input.endTime,
    category: input.category,
    address: input.address,
    mapsUrl: input.mapsUrl,
    cost: input.cost,
    bookingRef: input.bookingRef,
    url: input.url,
    ...fromLocalizedValue("title", input.title),
    ...fromLocalizedValue("locationName", input.locationName),
    ...fromLocalizedValue("note", input.note),
  };
}

export async function createItineraryItemAction(input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = itineraryInputSchema.safeParse(input);
  if (!parsed.success) return fail("表單資料有誤", fieldErrorsOf(parsed.error));

  const day = await prisma.day.findUnique({ where: { id: parsed.data.dayId } });
  if (!day) return fail("找不到日期");

  const count = await prisma.itineraryItem.count({ where: { dayId: day.id } });
  const title = firstNonEmpty(parsed.data.title);
  await prisma.itineraryItem.create({
    data: { ...toItineraryData(parsed.data), order: count, createdById: user.id },
  });

  await writeLog({
    tripId: day.tripId,
    userId: user.id,
    action: "ITEM_CREATE",
    targetType: "ItineraryItem",
    targetName: title,
    summary: `新增行程「${title}」`,
  });

  revalidatePath("/");
  return ok();
}

export async function updateItineraryItemAction(itemId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = itineraryInputSchema.safeParse(input);
  if (!parsed.success) return fail("表單資料有誤", fieldErrorsOf(parsed.error));

  const existing = await prisma.itineraryItem.findUnique({ where: { id: itemId }, include: { day: true } });
  if (!existing) return fail("找不到行程");

  const title = firstNonEmpty(parsed.data.title);
  await prisma.itineraryItem.update({ where: { id: itemId }, data: toItineraryData(parsed.data) });

  await writeLog({
    tripId: existing.day.tripId,
    userId: user.id,
    action: "ITEM_UPDATE",
    targetType: "ItineraryItem",
    targetName: title,
    summary: `編輯行程「${title}」`,
  });

  revalidatePath("/");
  return ok();
}

export async function deleteItineraryItemAction(itemId: string): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await prisma.itineraryItem.findUnique({ where: { id: itemId }, include: { day: true } });
  if (!existing) return fail("找不到行程");

  const title = existing.titleZh || existing.titleEn || existing.titleJa || "";
  await prisma.itineraryItem.delete({ where: { id: itemId } });

  await writeLog({
    tripId: existing.day.tripId,
    userId: user.id,
    action: "ITEM_DELETE",
    targetType: "ItineraryItem",
    targetName: title,
    summary: `刪除行程「${title}」`,
  });

  revalidatePath("/");
  return ok();
}

export async function moveItineraryItemAction(itemId: string, direction: "up" | "down"): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await prisma.itineraryItem.findUnique({
    where: { id: itemId },
    include: { day: { include: { items: true } } },
  });
  if (!existing) return fail("找不到行程");

  const sorted = sortItineraryItems(existing.day.items);
  const idx = sorted.findIndex((i) => i.id === itemId);
  const targetIdx = direction === "up" ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= sorted.length) return ok();

  const a = sorted[idx];
  const b = sorted[targetIdx];
  await prisma.$transaction([
    prisma.itineraryItem.update({ where: { id: a.id }, data: { startTime: b.startTime, order: b.order } }),
    prisma.itineraryItem.update({ where: { id: b.id }, data: { startTime: a.startTime, order: a.order } }),
  ]);

  const title = existing.titleZh || existing.titleEn || existing.titleJa || "";
  await writeLog({
    tripId: existing.day.tripId,
    userId: user.id,
    action: "ITEM_REORDER",
    targetType: "ItineraryItem",
    targetName: title,
    summary: `調整「${title}」的順序`,
  });

  revalidatePath("/");
  return ok();
}
