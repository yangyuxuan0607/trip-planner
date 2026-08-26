"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { LOCALES } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";

const LABELS: Record<(typeof LOCALES)[number], string> = { zh: "中文", en: "EN", ja: "日本語" };

export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useI18n();

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium transition",
            l === locale ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary",
          )}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
