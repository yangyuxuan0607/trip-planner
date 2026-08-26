"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/I18nProvider";
import { LOCALES, type Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import type { LocalizedValue } from "@/lib/i18n/content";

const TAB_LABEL: Record<Locale, string> = { zh: "中", en: "EN", ja: "日" };

function LocalePills({
  value,
  active,
  onSelect,
}: {
  value: LocalizedValue;
  active: Locale;
  onSelect: (locale: Locale) => void;
}) {
  return (
    <div className="flex gap-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onSelect(l)}
          className={cn(
            "flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] transition",
            l === active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground",
          )}
        >
          {TAB_LABEL[l]}
          <span className={cn("size-1 rounded-full", value[l].trim() ? "bg-current" : "bg-current opacity-25")} />
        </button>
      ))}
    </div>
  );
}

export function LocalizedInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: LocalizedValue;
  onChange: (value: LocalizedValue) => void;
  placeholder?: string;
}) {
  const { locale } = useI18n();
  const [active, setActive] = useState<Locale>(locale);

  return (
    <div className="space-y-1">
      <LocalePills value={value} active={active} onSelect={setActive} />
      <Input
        id={id}
        value={value[active]}
        onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );
}

export function LocalizedTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id?: string;
  value: LocalizedValue;
  onChange: (value: LocalizedValue) => void;
  placeholder?: string;
  rows?: number;
}) {
  const { locale } = useI18n();
  const [active, setActive] = useState<Locale>(locale);

  return (
    <div className="space-y-1">
      <LocalePills value={value} active={active} onSelect={setActive} />
      <Textarea
        id={id}
        rows={rows}
        value={value[active]}
        onChange={(e) => onChange({ ...value, [active]: e.target.value })}
        placeholder={placeholder}
      />
    </div>
  );
}
