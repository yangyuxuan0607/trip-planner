"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeLog } from "@/lib/activityLog";
import { expenseInputSchema } from "@/lib/validation/expense";
import { fieldErrorsOf } from "@/lib/validation/util";
import { fromLocalizedValue, firstNonEmpty } from "@/lib/i18n/content";
import { splitEvenly, formatCurrency } from "@/lib/money";
import { ok, fail, type ActionResult } from "@/lib/actionResult";

export async function createExpenseAction(tripId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) return fail("表單資料有誤", fieldErrorsOf(parsed.error));

  const shares = splitEvenly(parsed.data.amount, parsed.data.participantIds);
  const title = firstNonEmpty(parsed.data.title);

  await prisma.expense.create({
    data: {
      tripId,
      itemId: parsed.data.itemId,
      date: new Date(`${parsed.data.date}T00:00:00Z`),
      category: parsed.data.category,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      paidById: parsed.data.paidById,
      createdById: user.id,
      note: parsed.data.note,
      ...fromLocalizedValue("title", parsed.data.title),
      participants: {
        create: parsed.data.participantIds.map((userId) => ({ userId, shareAmount: shares[userId] })),
      },
    },
  });

  await writeLog({
    tripId,
    userId: user.id,
    action: "EXPENSE_CREATE",
    targetType: "Expense",
    targetName: title,
    summary: `新增支出「${title}」${formatCurrency(parsed.data.amount, parsed.data.currency)}`,
  });

  revalidatePath("/");
  return ok();
}

export async function updateExpenseAction(expenseId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = expenseInputSchema.safeParse(input);
  if (!parsed.success) return fail("表單資料有誤", fieldErrorsOf(parsed.error));

  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) return fail("找不到支出");

  const shares = splitEvenly(parsed.data.amount, parsed.data.participantIds);
  const title = firstNonEmpty(parsed.data.title);

  await prisma.$transaction([
    prisma.expenseParticipant.deleteMany({ where: { expenseId } }),
    prisma.expense.update({
      where: { id: expenseId },
      data: {
        itemId: parsed.data.itemId,
        date: new Date(`${parsed.data.date}T00:00:00Z`),
        category: parsed.data.category,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        paidById: parsed.data.paidById,
        note: parsed.data.note,
        ...fromLocalizedValue("title", parsed.data.title),
        participants: {
          create: parsed.data.participantIds.map((userId) => ({ userId, shareAmount: shares[userId] })),
        },
      },
    }),
  ]);

  await writeLog({
    tripId: existing.tripId,
    userId: user.id,
    action: "EXPENSE_UPDATE",
    targetType: "Expense",
    targetName: title,
    summary: `編輯支出「${title}」`,
  });

  revalidatePath("/");
  return ok();
}

export async function deleteExpenseAction(expenseId: string): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) return fail("找不到支出");

  const title = existing.titleZh || existing.titleEn || existing.titleJa || "";
  await prisma.expense.delete({ where: { id: expenseId } });

  await writeLog({
    tripId: existing.tripId,
    userId: user.id,
    action: "EXPENSE_DELETE",
    targetType: "Expense",
    targetName: title,
    summary: `刪除支出「${title}」`,
  });

  revalidatePath("/");
  return ok();
}
