import { z } from "zod";
import { CATEGORY_VALUES } from "@/lib/parser/types";
import { localizedTextSchema, nonEmptyLocalizedText } from "@/lib/validation/util";

export const expenseInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "請選擇日期"),
  title: localizedTextSchema.refine(nonEmptyLocalizedText, { message: "請至少填寫一種語言的項目名稱" }),
  category: z.enum(CATEGORY_VALUES),
  amount: z.number().int("金額需為整數").positive("金額必須大於 0"),
  currency: z.string().trim().min(1).max(10),
  paidById: z.string().min(1, "請選擇付款人"),
  participantIds: z.array(z.string()).min(1, "至少選一位分攤者"),
  note: z.string().trim().max(1000).nullable(),
  itemId: z.string().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseInputSchema>;
