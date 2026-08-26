import { z } from "zod";
import { CATEGORY_VALUES } from "@/lib/parser/types";
import { localizedTextSchema, nonEmptyLocalizedText } from "@/lib/validation/util";

const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "時間格式需為 HH:MM")
  .nullable();

const optionalUrl = z.string().url("請輸入正確的網址").nullable();

export const itineraryInputSchema = z.object({
  dayId: z.string().min(1, "請選擇日期"),
  startTime: timeField,
  endTime: timeField,
  title: localizedTextSchema.refine(nonEmptyLocalizedText, { message: "請至少填寫一種語言的標題" }),
  category: z.enum(CATEGORY_VALUES),
  locationName: localizedTextSchema,
  address: z.string().trim().max(300).nullable(),
  mapsUrl: optionalUrl,
  note: localizedTextSchema,
  cost: z.number().int().nonnegative("金額不能是負數").nullable(),
  bookingRef: z.string().trim().max(120).nullable(),
  url: optionalUrl,
});

export type ItineraryInput = z.infer<typeof itineraryInputSchema>;
