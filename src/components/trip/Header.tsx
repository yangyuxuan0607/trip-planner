"use client";

import { ChevronDown, FileText, Plus, Vote, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { UserMenu } from "@/components/trip/UserMenu";
import { useI18n } from "@/components/i18n/I18nProvider";
import { pickField } from "@/lib/i18n/content";
import { formatDateDots } from "@/lib/date";
import type { PublicUser, TripRecord } from "@/lib/types";

export function Header({
  trip,
  members,
  currentUser,
  onNewItem,
  onNewPoll,
  onImport,
  onExpense,
  onActivityLog,
  onSettings,
}: {
  trip: TripRecord;
  members: PublicUser[];
  currentUser: PublicUser;
  onNewItem: () => void;
  onNewPoll: () => void;
  onImport: () => void;
  onExpense: () => void;
  onActivityLog: () => void;
  onSettings: () => void;
}) {
  const { t, locale } = useI18n();
  const name = pickField(trip, "name", locale);
  const destination = pickField(trip, "destination", locale);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto max-w-[900px] px-4 py-2.5 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold sm:text-base">{name}</h1>
            <p className="truncate font-mono text-[11px] tabular-nums text-muted-foreground">
              {formatDateDots(trip.startDate)} – {formatDateDots(trip.endDate)} · {destination}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden -space-x-1.5 sm:flex">
              {members.map((m) => (
                <UserAvatar key={m.id} user={m} size="xs" className="ring-2 ring-background" />
              ))}
            </div>
            <UserMenu currentUser={currentUser} onActivityLog={onActivityLog} onSettings={onSettings} />
          </div>
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          <Button size="sm" variant="outline" onClick={onImport} className="shrink-0">
            <FileText className="size-3.5" /> {t("headerImport")}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" className="shrink-0" />}>
              <Plus className="size-3.5" /> {t("headerNew")}
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={onNewItem}>
                <Plus className="size-3.5" /> {t("headerNewItem")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNewPoll}>
                <Vote className="size-3.5" /> {t("headerNewPoll")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" onClick={onExpense} className="shrink-0">
            <Wallet className="size-3.5" /> {t("headerExpense")}
          </Button>
        </div>
      </div>
    </header>
  );
}
