"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { ResponsiveDialog } from "@/components/trip/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedInput } from "@/components/trip/LocalizedField";
import { useI18n } from "@/components/i18n/I18nProvider";
import { formatDateDots } from "@/lib/date";
import { toLocalizedValue, pickField, type LocalizedValue } from "@/lib/i18n/content";
import { createPollAction, updatePollAction } from "@/app/actions/poll";
import type { DayOption, PollWithOptions } from "@/lib/types";

const NO_DAY = "__none__";
const EMPTY_LOCALIZED: LocalizedValue = { zh: "", en: "", ja: "" };

type OptionFV = { id: string | null; label: LocalizedValue; note: LocalizedValue; mapsUrl: string; url: string; price: string };
type FormValues = { dayId: string; question: LocalizedValue; deadline: string; options: OptionFV[] };

const EMPTY_OPTION: OptionFV = { id: null, label: { ...EMPTY_LOCALIZED }, note: { ...EMPTY_LOCALIZED }, mapsUrl: "", url: "", price: "" };

function toFormValues(poll: PollWithOptions | null, prefill?: { dayId?: string | null; question?: string }): FormValues {
  if (!poll) {
    return {
      dayId: prefill?.dayId ?? NO_DAY,
      question: prefill?.question ? { zh: prefill.question, en: "", ja: "" } : { ...EMPTY_LOCALIZED },
      deadline: "",
      options: [{ ...EMPTY_OPTION }, { ...EMPTY_OPTION }],
    };
  }
  return {
    dayId: poll.dayId ?? NO_DAY,
    question: toLocalizedValue(poll, "question"),
    deadline: poll.deadline ? new Date(poll.deadline).toISOString().slice(0, 16) : "",
    options: poll.options.map((o) => ({
      id: o.id,
      label: toLocalizedValue(o, "label"),
      note: toLocalizedValue(o, "note"),
      mapsUrl: o.mapsUrl ?? "",
      url: o.url ?? "",
      price: o.price != null ? String(o.price) : "",
    })),
  };
}

export function PollFormSheet({
  open,
  onOpenChange,
  poll,
  tripId,
  days,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poll: PollWithOptions | null;
  tripId: string;
  days: DayOption[];
  prefill?: { dayId?: string | null; question?: string } | null;
}) {
  const { t } = useI18n();
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={poll ? t("pollFormTitleEdit") : t("pollFormTitleNew")}>
      {open && (
        <PollFormBody
          key={poll?.id ?? `new-${prefill?.dayId ?? ""}-${prefill?.question ?? ""}`}
          poll={poll}
          tripId={tripId}
          days={days}
          prefill={prefill}
          onOpenChange={onOpenChange}
        />
      )}
    </ResponsiveDialog>
  );
}

function PollFormBody({
  poll,
  tripId,
  days,
  prefill,
  onOpenChange,
}: {
  poll: PollWithOptions | null;
  tripId: string;
  days: DayOption[];
  prefill?: { dayId?: string | null; question?: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const {
    handleSubmit,
    control,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toFormValues(poll, prefill ?? undefined) });
  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const payload = {
      dayId: values.dayId === NO_DAY ? null : values.dayId,
      question: values.question,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      options: values.options.map((o) => ({
        id: o.id,
        label: o.label,
        note: o.note,
        mapsUrl: o.mapsUrl.trim() || null,
        url: o.url.trim() || null,
        price: o.price.trim() === "" ? null : Number(o.price),
      })),
    };
    const res = poll ? await updatePollAction(poll.id, payload) : await createPollAction(tripId, payload);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors?.question) setError("question", { message: res.fieldErrors.question });
      return;
    }
    onOpenChange(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="space-y-1">
        <Label>{t("pollFormQuestion")}</Label>
        <Controller control={control} name="question" render={({ field }) => <LocalizedInput value={field.value} onChange={field.onChange} />} />
        {errors.question && <p className="text-xs text-destructive">{errors.question.message ?? t("formAtLeastOneLanguage")}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="pollDayId">{t("pollFormDay")}</Label>
          <Controller
            control={control}
            name="dayId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="pollDayId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DAY}>{t("pollFormNoDay")}</SelectItem>
                  {days.map((d) => {
                    const dayTitle = pickField(d, "title", locale);
                    return (
                      <SelectItem key={d.id} value={d.id}>
                        {formatDateDots(d.date)} {dayTitle ? `· ${dayTitle}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="deadline">{t("pollFormDeadline")}</Label>
          <Input id="deadline" type="datetime-local" {...register("deadline")} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("pollFormOptions")}</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_OPTION, label: { ...EMPTY_LOCALIZED }, note: { ...EMPTY_LOCALIZED } })}>
            <Plus className="size-3.5" /> {t("pollFormAddOption")}
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2 rounded-sm border border-border/70 p-2.5">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Controller
                  control={control}
                  name={`options.${index}.label`}
                  render={({ field: f }) => (
                    <LocalizedInput value={f.value} onChange={f.onChange} placeholder={t("pollFormOptionLabelPlaceholder", { index: index + 1 })} />
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-1 shrink-0 text-muted-foreground"
                disabled={fields.length <= 2}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {errors.options?.[index]?.label && (
              <p className="text-xs text-destructive">{t("pollFormOptionLabelRequired")}</p>
            )}
            <Controller
              control={control}
              name={`options.${index}.note`}
              render={({ field: f }) => <LocalizedInput value={f.value} onChange={f.onChange} placeholder={t("pollFormOptionNotePlaceholder")} />}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input {...register(`options.${index}.mapsUrl`)} placeholder={t("pollFormOptionMapsPlaceholder")} />
              <Input {...register(`options.${index}.price`)} type="number" min={0} inputMode="numeric" placeholder={t("pollFormOptionPricePlaceholder")} />
            </div>
            <Input {...register(`options.${index}.url`)} placeholder={t("pollFormOptionUrlPlaceholder")} />
          </div>
        ))}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t("formCancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {poll ? t("formSave") : t("pollFormBuild")}
        </Button>
      </div>
    </form>
  );
}
