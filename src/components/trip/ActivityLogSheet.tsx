"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ACTIVITY_ACTION_LABEL_KEYS } from "@/lib/activityLabels";
import type { ActivityLogWithUser } from "@/lib/types";

const DATE_LOCALE: Record<string, string> = { zh: "zh-TW", en: "en-US", ja: "ja-JP" };

export function ActivityLogSheet({
  open,
  onOpenChange,
  logs,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: ActivityLogWithUser[];
}) {
  const { t, locale } = useI18n();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("userMenuActivityLog")}</SheetTitle>
          <SheetDescription>{t("activityLogRecent", { count: logs.length })}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {logs.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">{t("activityLogEmpty")}</p>
          ) : (
            <div className="divide-y divide-dashed divide-border/70">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-2 text-xs">
                  <UserAvatar user={log.user} size="xs" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="font-medium">{log.user.name}</span>{" "}
                      <span className="text-muted-foreground">{t(ACTIVITY_ACTION_LABEL_KEYS[log.action])}</span>
                    </p>
                    <p className="truncate text-muted-foreground">{log.summary}</p>
                  </div>
                  <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString(DATE_LOCALE[locale], {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
