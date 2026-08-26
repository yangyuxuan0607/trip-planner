"use client";

import { Plus, Vote } from "lucide-react";
import { ItineraryRow } from "@/components/trip/ItineraryRow";
import { PollBlock } from "@/components/trip/PollBlock";
import { useI18n } from "@/components/i18n/I18nProvider";
import { pickField } from "@/lib/i18n/content";
import { sortItineraryItems } from "@/lib/sort";
import { formatDateDots, formatWeekday } from "@/lib/date";
import type { DayWithItems, ItemWithCreator, PollWithOptions, PublicUser } from "@/lib/types";

export function DayReceipt({
  day,
  dayIndex,
  polls,
  members,
  currentUserId,
  currency,
  onEditItem,
  onNewItem,
  onNewPoll,
  onEditPoll,
}: {
  day: DayWithItems;
  dayIndex: number;
  polls: PollWithOptions[];
  members: PublicUser[];
  currentUserId: string;
  currency: string;
  onEditItem: (item: ItemWithCreator) => void;
  onNewItem: (dayId: string) => void;
  onNewPoll: (dayId: string) => void;
  onEditPoll: (poll: PollWithOptions) => void;
}) {
  const { t, locale } = useI18n();
  const items = sortItineraryItems(day.items);
  const dayTitle = pickField(day, "title", locale);

  return (
    <section className="receipt my-6 rounded-md border border-border/70 px-4 pb-4 pt-4 sm:px-6">
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground">
            DAY {String(dayIndex + 1).padStart(2, "0")}
          </p>
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatDateDots(day.date)} / {formatWeekday(day.date)}
          </p>
        </div>
        {dayTitle && <p className="text-right text-sm font-semibold">{dayTitle}</p>}
      </header>

      <div className="dashed-sep" />

      {items.length === 0 && polls.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">{t("dayEmpty")}</p>
      )}

      <div>
        {items.map((item, idx) => (
          <ItineraryRow
            key={item.id}
            item={item}
            isFirst={idx === 0}
            isLast={idx === items.length - 1}
            currency={currency}
            onEdit={onEditItem}
          />
        ))}
      </div>

      {polls.length > 0 && (
        <div className="mt-3 space-y-3 border-t border-dashed border-border/70 pt-3">
          {polls.map((poll) => (
            <PollBlock
              key={poll.id}
              poll={poll}
              members={members}
              currentUserId={currentUserId}
              currency={currency}
              onEdit={onEditPoll}
            />
          ))}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onNewItem(day.id)}
          className="flex flex-1 items-center justify-center gap-1 rounded-sm border border-dashed border-border py-1.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-3.5" /> {t("dayAddItem")}
        </button>
        <button
          type="button"
          onClick={() => onNewPoll(day.id)}
          className="flex items-center justify-center gap-1 rounded-sm border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
        >
          <Vote className="size-3.5" /> {t("dayAddPoll")}
        </button>
      </div>
    </section>
  );
}
