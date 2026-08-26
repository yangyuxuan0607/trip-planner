import { z } from "zod";

/** 三語欄位：至少要有一種語言非空的欄位用 `.refine(nonEmptyLocalizedText)` */
export const localizedTextSchema = z.object({
  zh: z.string().trim(),
  en: z.string().trim(),
  ja: z.string().trim(),
});

export function nonEmptyLocalizedText(value: z.infer<typeof localizedTextSchema>) {
  return Boolean(value.zh || value.en || value.ja);
}

export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const key of Object.keys(flat)) {
    const first = flat[key]?.[0];
    if (first) out[key] = first;
  }
  return out;
}
