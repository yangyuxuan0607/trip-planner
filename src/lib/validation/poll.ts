import { z } from "zod";
import { localizedTextSchema, nonEmptyLocalizedText } from "@/lib/validation/util";

const optionalUrl = z.string().url("請輸入正確的網址").nullable();

export const pollOptionInputSchema = z.object({
  id: z.string().nullable(),
  label: localizedTextSchema.refine(nonEmptyLocalizedText, { message: "請至少填寫一種語言的選項名稱" }),
  note: localizedTextSchema,
  mapsUrl: optionalUrl,
  url: optionalUrl,
  price: z.number().int().nonnegative().nullable(),
});

export const pollInputSchema = z.object({
  dayId: z.string().nullable(),
  question: localizedTextSchema.refine(nonEmptyLocalizedText, { message: "請至少填寫一種語言的投票問題" }),
  deadline: z.string().nullable(),
  options: z.array(pollOptionInputSchema).min(2, "至少需要 2 個選項"),
});

export type PollInput = z.infer<typeof pollInputSchema>;
export type PollOptionInput = z.infer<typeof pollOptionInputSchema>;
