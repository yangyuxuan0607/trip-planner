"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Search } from "lucide-react";
import { ResponsiveDialog } from "@/components/trip/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedInput, LocalizedTextarea } from "@/components/trip/LocalizedField";
import { useI18n } from "@/components/i18n/I18nProvider";
import { CATEGORY_VALUES, CATEGORY_LABEL_KEYS } from "@/lib/categories";
import { buildMapsSearchUrl } from "@/lib/maps";
import { formatDateDots } from "@/lib/date";
import { toLocalizedValue, firstNonEmpty, pickField, type LocalizedValue } from "@/lib/i18n/content";
import { createItineraryItemAction, updateItineraryItemAction } from "@/app/actions/itinerary";
import type { DayOption, ItemWithCreator } from "@/lib/types";
import type { Category } from "@prisma/client";

type FormValues = {
  dayId: string;
  startTime: string;
  endTime: string;
  title: LocalizedValue;
  category: Category;
  locationName: LocalizedValue;
  address: string;
  mapsUrl: string;
  note: LocalizedValue;
  cost: string;
  bookingRef: string;
  url: string;
};

const EMPTY_LOCALIZED: LocalizedValue = { zh: "", en: "", ja: "" };

function toFormValues(item: ItemWithCreator | null, defaultDayId: string | null): FormValues {
  if (!item)
    return {
      dayId: defaultDayId ?? "",
      startTime: "",
      endTime: "",
      title: { ...EMPTY_LOCALIZED },
      category: "OTHER",
      locationName: { ...EMPTY_LOCALIZED },
      address: "",
      mapsUrl: "",
      note: { ...EMPTY_LOCALIZED },
      cost: "",
      bookingRef: "",
      url: "",
    };
  return {
    dayId: item.dayId,
    startTime: item.startTime ?? "",
    endTime: item.endTime ?? "",
    title: toLocalizedValue(item, "title"),
    category: item.category,
    locationName: toLocalizedValue(item, "locationName"),
    address: item.address ?? "",
    mapsUrl: item.mapsUrl ?? "",
    note: toLocalizedValue(item, "note"),
    cost: item.cost != null ? String(item.cost) : "",
    bookingRef: item.bookingRef ?? "",
    url: item.url ?? "",
  };
}

export function ItineraryFormSheet({
  open,
  onOpenChange,
  item,
  defaultDayId,
  days,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemWithCreator | null;
  defaultDayId: string | null;
  days: DayOption[];
  currency: string;
}) {
  const { t } = useI18n();
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={item ? t("itineraryFormTitleEdit") : t("itineraryFormTitleNew")}
    >
      {open && (
        <ItineraryFormBody
          key={item?.id ?? `new-${defaultDayId ?? ""}`}
          item={item}
          defaultDayId={defaultDayId}
          days={days}
          currency={currency}
          onOpenChange={onOpenChange}
        />
      )}
    </ResponsiveDialog>
  );
}

function ItineraryFormBody({
  item,
  defaultDayId,
  days,
  currency,
  onOpenChange,
}: {
  item: ItemWithCreator | null;
  defaultDayId: string | null;
  days: DayOption[];
  currency: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toFormValues(item, defaultDayId) });
  const [serverError, setServerError] = useState<string | null>(null);

  const locationName = watch("locationName");
  const address = watch("address");

  function searchOnMaps() {
    const query = firstNonEmpty(locationName) || address.trim();
    if (!query) return;
    window.open(buildMapsSearchUrl(query), "_blank", "noopener,noreferrer");
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const payload = {
      dayId: values.dayId,
      startTime: values.startTime || null,
      endTime: values.endTime || null,
      title: values.title,
      category: values.category,
      locationName: values.locationName,
      address: values.address.trim() || null,
      mapsUrl: values.mapsUrl.trim() || null,
      note: values.note,
      cost: values.cost.trim() === "" ? null : Number(values.cost),
      bookingRef: values.bookingRef.trim() || null,
      url: values.url.trim() || null,
    };
    const res = item ? await updateItineraryItemAction(item.id, payload) : await createItineraryItemAction(payload);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          setError(key as keyof FormValues, { message });
        }
      }
      return;
    }
    onOpenChange(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="dayId">{t("formDate")}</Label>
          <Controller
            control={control}
            name="dayId"
            rules={{ required: t("formSelectDate") }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="dayId" className="w-full">
                  <SelectValue placeholder={t("formSelectDate")} />
                </SelectTrigger>
                <SelectContent>
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
          {errors.dayId && <p className="text-xs text-destructive">{errors.dayId.message}</p>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="category">{t("formCategory")}</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" className="w-full">
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
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="startTime">{t("formStartTime")}</Label>
          <Input id="startTime" type="time" {...register("startTime")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="endTime">{t("formEndTime")}</Label>
          <Input id="endTime" type="time" {...register("endTime")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>{t("formTitle")}</Label>
        <Controller control={control} name="title" render={({ field }) => <LocalizedInput value={field.value} onChange={field.onChange} />} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message ?? t("formAtLeastOneLanguage")}</p>}
      </div>

      <div className="space-y-1">
        <Label>{t("formLocationName")}</Label>
        <Controller
          control={control}
          name="locationName"
          render={({ field }) => <LocalizedInput value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="address">{t("formAddress")}</Label>
        <Input id="address" {...register("address")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="mapsUrl">{t("formMapsUrl")}</Label>
        <div className="flex gap-2">
          <Input id="mapsUrl" {...register("mapsUrl")} placeholder="https://maps.app.goo.gl/..." className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={searchOnMaps}
            disabled={!firstNonEmpty(locationName) && !address.trim()}
          >
            <Search className="size-3.5" /> {t("formMapsSearch")}
          </Button>
        </div>
        {errors.mapsUrl && <p className="text-xs text-destructive">{errors.mapsUrl.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cost">{t("formCost", { currency })}</Label>
          <Input id="cost" type="number" min={0} step={1} inputMode="numeric" {...register("cost")} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="bookingRef">{t("formBookingRef")}</Label>
          <Input id="bookingRef" {...register("bookingRef")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="url">{t("formUrl")}</Label>
        <Input id="url" {...register("url")} placeholder="https://..." />
        {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>{t("formNote")}</Label>
        <Controller control={control} name="note" render={({ field }) => <LocalizedTextarea value={field.value} onChange={field.onChange} />} />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t("formCancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {item ? t("formSave") : t("formAdd")}
        </Button>
      </div>
    </form>
  );
}
