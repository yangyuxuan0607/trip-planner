"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { useI18n } from "@/components/i18n/I18nProvider";
import { pickField } from "@/lib/i18n/content";
import { formatDateDots } from "@/lib/date";
import type { PublicUser, TripRecord } from "@/lib/types";

export function SettingsSheet({
  open,
  onOpenChange,
  trip,
  members,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: TripRecord;
  members: PublicUser[];
}) {
  const { t, locale } = useI18n();
  const name = pickField(trip, "name", locale);
  const destination = pickField(trip, "destination", locale);
  const [before, after] = t("settingsEditUsersNote").split("{path}");
  const [afterPath, tail] = after.split("{cmd}");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("userMenuSettings")}</SheetTitle>
          <SheetDescription>{t("settingsSubtitle")}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6 text-sm">
          <section className="space-y-1">
            <p className="font-medium">{name}</p>
            <p className="text-muted-foreground">{destination}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {formatDateDots(trip.startDate)} – {formatDateDots(trip.endDate)}
            </p>
          </section>
          <section>
            <p className="mb-2 text-xs font-medium text-muted-foreground">{t("settingsMembers")}</p>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <UserAvatar user={m} size="sm" />
                  <span>{m.name}</span>
                </div>
              ))}
            </div>
          </section>
          <p className="rounded-sm bg-secondary/50 p-2.5 text-xs text-muted-foreground">
            {before}
            <code className="rounded bg-background px-1 py-0.5 font-mono">src/lib/config/users.ts</code>
            {afterPath}
            <code className="rounded bg-background px-1 py-0.5 font-mono">npm run db:seed</code>
            {tail}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
