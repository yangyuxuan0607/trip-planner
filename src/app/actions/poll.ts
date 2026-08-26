"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { writeLog } from "@/lib/activityLog";
import { pollInputSchema } from "@/lib/validation/poll";
import { fieldErrorsOf } from "@/lib/validation/util";
import { fromLocalizedValue, firstNonEmpty } from "@/lib/i18n/content";
import { ok, fail, type ActionResult } from "@/lib/actionResult";

export async function createPollAction(tripId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = pollInputSchema.safeParse(input);
  if (!parsed.success) return fail("表單資料有誤", fieldErrorsOf(parsed.error));

  const question = firstNonEmpty(parsed.data.question);
  await prisma.poll.create({
    data: {
      tripId,
      dayId: parsed.data.dayId,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      createdById: user.id,
      ...fromLocalizedValue("question", parsed.data.question),
      options: {
        create: parsed.data.options.map((o, order) => ({
          mapsUrl: o.mapsUrl,
          url: o.url,
          price: o.price,
          order,
          ...fromLocalizedValue("label", o.label),
          ...fromLocalizedValue("note", o.note),
        })),
      },
    },
  });

  await writeLog({
    tripId,
    userId: user.id,
    action: "POLL_CREATE",
    targetType: "Poll",
    targetName: question,
    summary: `建立投票「${question}」，${parsed.data.options.length} 個選項`,
  });

  revalidatePath("/");
  return ok();
}

export async function updatePollAction(pollId: string, input: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = pollInputSchema.safeParse(input);
  if (!parsed.success) return fail("表單資料有誤", fieldErrorsOf(parsed.error));

  const existing = await prisma.poll.findUnique({ where: { id: pollId }, include: { options: true } });
  if (!existing) return fail("找不到投票");

  const keepIds = parsed.data.options.filter((o) => o.id).map((o) => o.id as string);
  const removeIds = existing.options.filter((o) => !keepIds.includes(o.id)).map((o) => o.id);
  const question = firstNonEmpty(parsed.data.question);

  await prisma.$transaction([
    prisma.poll.update({
      where: { id: pollId },
      data: {
        dayId: parsed.data.dayId,
        deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
        ...fromLocalizedValue("question", parsed.data.question),
      },
    }),
    ...(removeIds.length > 0 ? [prisma.pollOption.deleteMany({ where: { id: { in: removeIds } } })] : []),
    ...parsed.data.options.map((o, order) => {
      const data = {
        mapsUrl: o.mapsUrl,
        url: o.url,
        price: o.price,
        order,
        ...fromLocalizedValue("label", o.label),
        ...fromLocalizedValue("note", o.note),
      };
      return o.id
        ? prisma.pollOption.update({ where: { id: o.id }, data })
        : prisma.pollOption.create({ data: { ...data, pollId } });
    }),
  ]);

  await writeLog({
    tripId: existing.tripId,
    userId: user.id,
    action: "POLL_UPDATE",
    targetType: "Poll",
    targetName: question,
    summary: `編輯投票「${question}」`,
  });

  revalidatePath("/");
  return ok();
}

export async function deletePollAction(pollId: string): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!existing) return fail("找不到投票");

  const question = existing.questionZh || existing.questionEn || existing.questionJa || "";
  await prisma.poll.delete({ where: { id: pollId } });

  await writeLog({
    tripId: existing.tripId,
    userId: user.id,
    action: "POLL_DELETE",
    targetType: "Poll",
    targetName: question,
    summary: `刪除投票「${question}」`,
  });

  revalidatePath("/");
  return ok();
}

export async function voteAction(pollId: string, optionId: string): Promise<ActionResult> {
  const user = await requireUser();
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) return fail("找不到投票");

  const option = await prisma.pollOption.findUnique({ where: { id: optionId } });
  if (!option || option.pollId !== pollId) return fail("找不到選項");

  await prisma.vote.upsert({
    where: { pollId_userId: { pollId, userId: user.id } },
    update: { pollOptionId: optionId },
    create: { pollId, pollOptionId: optionId, userId: user.id },
  });

  const question = poll.questionZh || poll.questionEn || poll.questionJa || "";
  const optionLabel = option.labelZh || option.labelEn || option.labelJa || "";
  await writeLog({
    tripId: poll.tripId,
    userId: user.id,
    action: "VOTE_CAST",
    targetType: "Poll",
    targetName: question,
    summary: `投給了「${optionLabel}」`,
  });

  revalidatePath("/");
  return ok();
}
