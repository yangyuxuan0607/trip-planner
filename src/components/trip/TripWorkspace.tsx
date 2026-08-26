"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Header } from "@/components/trip/Header";
import { DayReceipt } from "@/components/trip/DayReceipt";
import { PollBlock } from "@/components/trip/PollBlock";
import { ItineraryFormSheet } from "@/components/trip/ItineraryFormSheet";
import { PollFormSheet } from "@/components/trip/PollFormSheet";
import { ImportTextDialog } from "@/components/trip/ImportTextDialog";
import { ExpenseSheet } from "@/components/trip/ExpenseSheet";
import { ActivityLogSheet } from "@/components/trip/ActivityLogSheet";
import { SettingsSheet } from "@/components/trip/SettingsSheet";
import { useI18n } from "@/components/i18n/I18nProvider";
import type {
  DayWithItems,
  ExpenseWithDetails,
  ItemWithCreator,
  PollWithOptions,
  PublicUser,
  ActivityLogWithUser,
  TripRecord,
} from "@/lib/types";

export function TripWorkspace({
  trip,
  days,
  polls,
  members,
  currentUser,
  expenses,
  logs,
}: {
  trip: TripRecord;
  days: DayWithItems[];
  polls: PollWithOptions[];
  members: PublicUser[];
  currentUser: PublicUser;
  expenses: ExpenseWithDetails[];
  logs: ActivityLogWithUser[];
}) {
  const { t } = useI18n();
  const [itemForm, setItemForm] = useState<{ open: boolean; item: ItemWithCreator | null; dayId: string | null }>({
    open: false,
    item: null,
    dayId: null,
  });
  const [pollForm, setPollForm] = useState<{ open: boolean; poll: PollWithOptions | null; dayId: string | null }>({
    open: false,
    poll: null,
    dayId: null,
  });
  const [importOpen, setImportOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dayOptions = days.map((d) => ({
    id: d.id,
    date: d.date,
    titleZh: d.titleZh,
    titleEn: d.titleEn,
    titleJa: d.titleJa,
  }));
  const unassignedPolls = polls.filter((p) => !p.dayId);
  const pollsByDay = new Map<string, PollWithOptions[]>();
  for (const p of polls) {
    if (!p.dayId) continue;
    pollsByDay.set(p.dayId, [...(pollsByDay.get(p.dayId) ?? []), p]);
  }

  return (
    <div className="min-h-screen pb-24 sm:pb-10">
      <Header
        trip={trip}
        members={members}
        currentUser={currentUser}
        onNewItem={() => setItemForm({ open: true, item: null, dayId: days[0]?.id ?? null })}
        onNewPoll={() => setPollForm({ open: true, poll: null, dayId: null })}
        onImport={() => setImportOpen(true)}
        onExpense={() => setExpenseOpen(true)}
        onActivityLog={() => setLogOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />

      <main className="mx-auto max-w-[900px] px-4 sm:px-6">
        {unassignedPolls.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="font-mono text-[11px] tracking-widest text-muted-foreground">{t("pollSectionTitle")}</p>
            {unassignedPolls.map((poll) => (
              <PollBlock
                key={poll.id}
                poll={poll}
                members={members}
                currentUserId={currentUser.id}
                currency={trip.currency}
                onEdit={(p) => setPollForm({ open: true, poll: p, dayId: p.dayId })}
              />
            ))}
          </div>
        )}

        {days.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("noDaysYet")}</p>
        ) : (
          days.map((day, index) => (
            <DayReceipt
              key={day.id}
              day={day}
              dayIndex={index}
              polls={pollsByDay.get(day.id) ?? []}
              members={members}
              currentUserId={currentUser.id}
              currency={trip.currency}
              onEditItem={(item) => setItemForm({ open: true, item, dayId: item.dayId })}
              onNewItem={(dayId) => setItemForm({ open: true, item: null, dayId })}
              onNewPoll={(dayId) => setPollForm({ open: true, poll: null, dayId })}
              onEditPoll={(poll) => setPollForm({ open: true, poll, dayId: poll.dayId })}
            />
          ))
        )}
      </main>

      <button
        type="button"
        onClick={() => setItemForm({ open: true, item: null, dayId: days[0]?.id ?? null })}
        className="fixed bottom-5 right-5 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:brightness-110 sm:hidden"
        aria-label={t("headerNewItem")}
      >
        <Plus className="size-6" />
      </button>

      <ItineraryFormSheet
        open={itemForm.open}
        onOpenChange={(open) => setItemForm((s) => ({ ...s, open }))}
        item={itemForm.item}
        defaultDayId={itemForm.dayId}
        days={dayOptions}
        currency={trip.currency}
      />
      <PollFormSheet
        open={pollForm.open}
        onOpenChange={(open) => setPollForm((s) => ({ ...s, open }))}
        poll={pollForm.poll}
        tripId={trip.id}
        days={dayOptions}
        prefill={pollForm.poll ? null : { dayId: pollForm.dayId }}
      />
      <ImportTextDialog open={importOpen} onOpenChange={setImportOpen} days={dayOptions} />
      <ExpenseSheet
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        tripId={trip.id}
        members={members}
        expenses={expenses}
        currency={trip.currency}
      />
      <ActivityLogSheet open={logOpen} onOpenChange={setLogOpen} logs={logs} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} trip={trip} members={members} />
    </div>
  );
}
