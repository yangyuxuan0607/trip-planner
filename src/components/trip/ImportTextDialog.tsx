"use client";

import { useState, useTransition } from "react";
import { Sparkles, Vote } from "lucide-react";
import { ResponsiveDialog } from "@/components/trip/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedInput, LocalizedTextarea } from "@/components/trip/LocalizedField";
import { useI18n } from "@/components/i18n/I18nProvider";
import { CATEGORY_VALUES, CATEGORY_LABEL_KEYS } from "@/lib/categories";
import { formatDateDots, formatDateInput } from "@/lib/date";
import { previewImportAction, bulkImportItemsAction, type ImportItemPayload } from "@/app/actions/importText";
import type { LocalizedValue } from "@/lib/i18n/content";
import type { DraftItem } from "@/lib/parser/types";
import type { DayOption } from "@/lib/types";
import type { Category } from "@prisma/client";

const EMPTY_LOCALIZED: LocalizedValue = { zh: "", en: "", ja: "" };

type DraftRow = {
  include: boolean;
  dayId: string;
  startTime: string;
  title: LocalizedValue;
  category: Category;
  locationName: LocalizedValue;
  note: LocalizedValue;
  cost: string;
  suggestPoll: boolean;
};

function matchDay(dateStr: string | null, days: DayOption[]): string {
  if (dateStr) {
    const match = days.find((d) => formatDateInput(d.date) === dateStr);
    if (match) return match.id;
  }
  return days[0]?.id ?? "";
}

// 規則式/AI 解析出來的文字語言未知，一律先放進 zh 欄位，使用者可以在預覽時自行切換語言補上翻譯
function toDraftRows(items: DraftItem[], days: DayOption[]): DraftRow[] {
  return items.map((it) => ({
    include: true,
    dayId: matchDay(it.date, days),
    startTime: it.startTime ?? "",
    title: { ...EMPTY_LOCALIZED, zh: it.title },
    category: it.category,
    locationName: { ...EMPTY_LOCALIZED, zh: it.locationName ?? "" },
    note: { ...EMPTY_LOCALIZED, zh: it.note ?? "" },
    cost: it.cost != null ? String(it.cost) : "",
    suggestPoll: it.suggestPoll,
  }));
}

export function ImportTextDialog({
  open,
  onOpenChange,
  days,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  days: DayOption[];
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [rows, setRows] = useState<DraftRow[] | null>(null);
  const [usedAI, setUsedAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setText("");
    setRows(null);
    setError(null);
  }

  function close() {
    onOpenChange(false);
    reset();
  }

  function parse() {
    setError(null);
    startTransition(async () => {
      const res = await previewImportAction(text);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setUsedAI(res.data!.usedAI);
      setRows(toDraftRows(res.data!.items, days));
    });
  }

  function updateRow(index: number, patch: Partial<DraftRow>) {
    setRows((prev) => prev && prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function confirm() {
    if (!rows) return;
    const selected = rows.filter((r) => r.include);
    if (selected.length === 0) {
      setError(t("importErrorNoneChecked"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const payload: ImportItemPayload[] = selected.map((r) => ({
        dayId: r.dayId,
        startTime: r.startTime || null,
        endTime: null,
        title: r.title,
        category: r.category,
        locationName: r.locationName,
        note: r.note,
        cost: r.cost.trim() === "" ? null : Number(r.cost),
      }));
      const res = await bulkImportItemsAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
    });
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) close();
        else onOpenChange(true);
      }}
      title={t("headerImport")}
      description={rows ? t("importSubtitleResult", { count: rows.length }) : t("importSubtitlePrompt")}
    >
      <div className="space-y-4 pt-2">
        {!rows && (
          <>
            <Textarea rows={8} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("importPlaceholder")} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={close}>
                {t("formCancel")}
              </Button>
              <Button type="button" onClick={parse} disabled={pending || !text.trim()}>
                {pending ? t("importParsing") : t("importParse")}
              </Button>
            </div>
          </>
        )}

        {rows && (
          <>
            <p className="text-xs text-muted-foreground">
              {t("importReviewHint", { method: usedAI ? t("importUsedAI") : t("importUsedRule") })}
            </p>
            <div className="space-y-3">
              {rows.map((row, index) => (
                <div key={index} className="space-y-2 rounded-sm border border-border/70 p-2.5">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      className="mt-1"
                      checked={row.include}
                      onCheckedChange={(v) => updateRow(index, { include: Boolean(v) })}
                    />
                    <div className="flex-1">
                      <LocalizedInput value={row.title} onChange={(v) => updateRow(index, { title: v })} />
                    </div>
                    {row.suggestPoll && (
                      <span className="flex shrink-0 items-center gap-1 self-center rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
                        <Vote className="size-3" /> {t("importSuggestPoll")}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pl-6">
                    <Select value={row.dayId} onValueChange={(v) => updateRow(index, { dayId: v ?? "" })}>
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {formatDateDots(d.date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => updateRow(index, { startTime: e.target.value })}
                    />
                    <Select value={row.category} onValueChange={(v) => updateRow(index, { category: v as Category })}>
                      <SelectTrigger className="w-full" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_VALUES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {t(CATEGORY_LABEL_KEYS[c])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pl-6">
                    <LocalizedInput value={row.locationName} onChange={(v) => updateRow(index, { locationName: v })} placeholder={t("formLocationName")} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div className="col-span-2">
                      <LocalizedTextarea rows={2} value={row.note} onChange={(v) => updateRow(index, { note: v })} placeholder={t("formNote")} />
                    </div>
                  </div>
                  <div className="pl-6">
                    <Input
                      placeholder={t("formCost", { currency: "" })}
                      type="number"
                      value={row.cost}
                      onChange={(e) => updateRow(index, { cost: e.target.value })}
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-between gap-2">
              <Button type="button" variant="ghost" onClick={() => setRows(null)}>
                <Sparkles className="size-3.5" /> {t("importReparse")}
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={close}>
                  {t("formCancel")}
                </Button>
                <Button type="button" onClick={confirm} disabled={pending}>
                  {t("importConfirm")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </ResponsiveDialog>
  );
}
