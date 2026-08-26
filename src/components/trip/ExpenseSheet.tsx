"use client";

import { useMemo, useState, useTransition } from "react";
import { ArrowRight, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { ExpenseFormSheet } from "@/components/trip/ExpenseFormSheet";
import { useI18n } from "@/components/i18n/I18nProvider";
import { pickField } from "@/lib/i18n/content";
import { CATEGORY_ICONS } from "@/lib/categories";
import { formatCurrency, settle } from "@/lib/money";
import { formatDateDots, formatDateInput } from "@/lib/date";
import { deleteExpenseAction } from "@/app/actions/expense";
import type { ExpenseWithDetails, PublicUser } from "@/lib/types";

export function ExpenseSheet({
  open,
  onOpenChange,
  tripId,
  members,
  expenses,
  currency,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  members: PublicUser[];
  expenses: ExpenseWithDetails[];
  currency: string;
}) {
  const { t, locale } = useI18n();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseWithDetails | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paid = new Map<string, number>();
    const owed = new Map<string, number>();
    for (const m of members) {
      paid.set(m.id, 0);
      owed.set(m.id, 0);
    }
    for (const e of expenses) {
      paid.set(e.paidById, (paid.get(e.paidById) ?? 0) + e.amount);
      for (const p of e.participants) {
        owed.set(p.userId, (owed.get(p.userId) ?? 0) + p.shareAmount);
      }
    }
    const net = members.map((m) => ({
      user: m,
      paid: paid.get(m.id) ?? 0,
      owed: owed.get(m.id) ?? 0,
      balance: (paid.get(m.id) ?? 0) - (owed.get(m.id) ?? 0),
    }));
    const transfers = settle(net.map((n) => ({ userId: n.user.id, balance: n.balance })));
    return { total, net, transfers };
  }, [expenses, members]);

  function userOf(id: string) {
    return members.find((m) => m.id === id);
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(expense: ExpenseWithDetails) {
    setEditing(expense);
    setFormOpen(true);
  }

  function remove(expense: ExpenseWithDetails) {
    const title = pickField(expense, "title", locale);
    if (!confirm(t("expenseDeleteConfirm", { title }))) return;
    startTransition(async () => {
      await deleteExpenseAction(expense.id);
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("headerExpense")}</SheetTitle>
            <SheetDescription>{t("expenseTotalSpent", { amount: formatCurrency(totals.total, currency) })}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6">
            <section className="space-y-1.5">
              {totals.net.map((n) => (
                <div key={n.user.id} className="flex items-center gap-2 text-xs">
                  <UserAvatar user={n.user} size="xs" />
                  <span className="w-14 shrink-0 font-medium">{n.user.name}</span>
                  <span className="flex-1 text-muted-foreground">
                    {t("expensePaidLabel", { amount: formatCurrency(n.paid, currency) })} ·{" "}
                    {t("expenseOwedLabel", { amount: formatCurrency(n.owed, currency) })}
                  </span>
                  <span className={`font-mono tabular-nums ${n.balance >= 0 ? "text-accent" : "text-destructive"}`}>
                    {n.balance >= 0 ? "+" : ""}
                    {formatCurrency(n.balance, currency)}
                  </span>
                </div>
              ))}
            </section>

            <section>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{t("expenseSettlement")}</p>
              {totals.transfers.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("expenseNoTransferNeeded")}</p>
              ) : (
                <div className="space-y-1">
                  {totals.transfers.map((tr, i) => (
                    <div key={i} className="flex items-center gap-1.5 rounded-sm bg-secondary/50 px-2 py-1.5 text-xs">
                      <span className="font-medium">{userOf(tr.fromUserId)?.name}</span>
                      <ArrowRight className="size-3 text-muted-foreground" />
                      <span className="font-medium">{userOf(tr.toUserId)?.name}</span>
                      <span className="ml-auto font-mono tabular-nums">{formatCurrency(tr.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{t("expenseDetail", { count: expenses.length })}</p>
                <Button size="sm" variant="outline" onClick={openNew}>
                  <Plus className="size-3.5" /> {t("expenseAdd")}
                </Button>
              </div>
              {expenses.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">{t("expenseEmpty")}</p>
              ) : (
                <div className="divide-y divide-dashed divide-border/70">
                  {expenses.map((e) => {
                    const Icon = CATEGORY_ICONS[e.category];
                    const title = pickField(e, "title", locale);
                    return (
                      <div key={e.id} className="flex items-center gap-2 py-2 text-xs">
                        <Icon className="size-3.5 shrink-0 text-accent" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{title}</p>
                          <p className="truncate text-muted-foreground">
                            {formatDateDots(new Date(e.date))} ·{" "}
                            {t("expensePaidBySplit", { payer: userOf(e.paidById)?.name ?? "", count: e.participants.length })}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono tabular-nums">{formatCurrency(e.amount, e.currency)}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={<Button variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground" disabled={pending} />}
                          >
                            <MoreVertical className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(e)}>
                              <Pencil className="size-3.5" /> {t("rowEdit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => remove(e)}>
                              <Trash2 className="size-3.5" /> {t("rowDelete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <ExpenseFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
        tripId={tripId}
        members={members}
        defaultDate={formatDateInput(new Date())}
        currency={currency}
      />
    </>
  );
}
