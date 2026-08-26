"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ResponsiveDialog } from "@/components/trip/ResponsiveDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { LocalizedInput } from "@/components/trip/LocalizedField";
import { useI18n } from "@/components/i18n/I18nProvider";
import { CATEGORY_VALUES, CATEGORY_LABEL_KEYS } from "@/lib/categories";
import { toLocalizedValue, type LocalizedValue } from "@/lib/i18n/content";
import { formatDateInput } from "@/lib/date";
import { createExpenseAction, updateExpenseAction } from "@/app/actions/expense";
import type { ExpenseWithDetails, PublicUser } from "@/lib/types";
import type { Category } from "@prisma/client";

type FormValues = {
  date: string;
  title: LocalizedValue;
  category: Category;
  amount: string;
  paidById: string;
  participantIds: string[];
  note: string;
};

function toFormValues(expense: ExpenseWithDetails | null, members: PublicUser[], defaultDate: string): FormValues {
  if (!expense) {
    return {
      date: defaultDate,
      title: { zh: "", en: "", ja: "" },
      category: "OTHER",
      amount: "",
      paidById: members[0]?.id ?? "",
      participantIds: members.map((m) => m.id),
      note: "",
    };
  }
  return {
    date: formatDateInput(new Date(expense.date)),
    title: toLocalizedValue(expense, "title"),
    category: expense.category,
    amount: String(expense.amount),
    paidById: expense.paidById,
    participantIds: expense.participants.map((p) => p.userId),
    note: expense.note ?? "",
  };
}

export function ExpenseFormSheet({
  open,
  onOpenChange,
  expense,
  tripId,
  members,
  defaultDate,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: ExpenseWithDetails | null;
  tripId: string;
  members: PublicUser[];
  defaultDate: string;
  currency: string;
}) {
  const { t } = useI18n();
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={expense ? t("expenseFormTitleEdit") : t("expenseFormTitleNew")}
    >
      {open && (
        <ExpenseFormBody
          key={expense?.id ?? "new"}
          expense={expense}
          tripId={tripId}
          members={members}
          defaultDate={defaultDate}
          currency={currency}
          onOpenChange={onOpenChange}
        />
      )}
    </ResponsiveDialog>
  );
}

function ExpenseFormBody({
  expense,
  tripId,
  members,
  defaultDate,
  currency,
  onOpenChange,
}: {
  expense: ExpenseWithDetails | null;
  tripId: string;
  members: PublicUser[];
  defaultDate: string;
  currency: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: toFormValues(expense, members, defaultDate) });
  const [serverError, setServerError] = useState<string | null>(null);

  async function onSubmit(values: FormValues) {
    setServerError(null);
    if (values.participantIds.length === 0) {
      setServerError(t("expenseFormParticipantsRequired"));
      return;
    }
    const payload = {
      date: values.date,
      title: values.title,
      category: values.category,
      amount: Number(values.amount),
      currency,
      paidById: values.paidById,
      participantIds: values.participantIds,
      note: values.note.trim() || null,
      itemId: null,
    };
    const res = expense ? await updateExpenseAction(expense.id, payload) : await createExpenseAction(tripId, payload);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    onOpenChange(false);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="date">{t("formDate")}</Label>
          <Input id="date" type="date" {...register("date", { required: true })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="amount">{t("expenseFormAmount", { currency })}</Label>
          <Input
            id="amount"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            {...register("amount", {
              required: t("expenseFormAmountRequired"),
              min: { value: 1, message: t("expenseFormAmountMin") },
            })}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>{t("formTitle")}</Label>
        <Controller
          control={control}
          name="title"
          render={({ field }) => <LocalizedInput value={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="expenseCategory">{t("formCategory")}</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="expenseCategory" className="w-full">
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
        <div className="space-y-1">
          <Label htmlFor="paidById">{t("expenseFormPaidBy")}</Label>
          <Controller
            control={control}
            name="paidById"
            rules={{ required: true }}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="paidById" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("expenseFormParticipants")}</Label>
        <Controller
          control={control}
          name="participantIds"
          render={({ field }) => (
            <div className="flex flex-wrap gap-3">
              {members.map((m) => {
                const checked = field.value.includes(m.id);
                return (
                  <label key={m.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => {
                        field.onChange(v ? [...field.value, m.id] : field.value.filter((id) => id !== m.id));
                      }}
                    />
                    <UserAvatar user={m} size="xs" />
                    {m.name}
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="expenseNote">{t("expenseFormNote")}</Label>
        <Textarea id="expenseNote" rows={2} {...register("note")} />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t("formCancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {expense ? t("formSave") : t("formAdd")}
        </Button>
      </div>
    </form>
  );
}
