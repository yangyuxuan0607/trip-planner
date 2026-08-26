import { z } from "zod";

export const CATEGORY_VALUES = [
  "TRANSPORT",
  "SIGHT",
  "FOOD",
  "LODGING",
  "SHOPPING",
  "FREE",
  "OTHER",
] as const;

export const draftItemSchema = z.object({
  date: z.string().nullable(),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  title: z.string().min(1),
  category: z.enum(CATEGORY_VALUES),
  locationName: z.string().nullable(),
  note: z.string().nullable(),
  cost: z.number().nullable(),
  suggestPoll: z.boolean(),
});

export type DraftItem = z.infer<typeof draftItemSchema>;

export const draftItemsSchema = z.array(draftItemSchema);
