"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, MapPin, MoreVertical, ExternalLink, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { useI18n } from "@/components/i18n/I18nProvider";
import { pickField } from "@/lib/i18n/content";
import { CATEGORY_ICONS, CATEGORY_LABEL_KEYS } from "@/lib/categories";
import { formatCurrency } from "@/lib/money";
import { resolveMapsUrl } from "@/lib/maps";
import { deleteItineraryItemAction, moveItineraryItemAction } from "@/app/actions/itinerary";
import type { ItemWithCreator } from "@/lib/types";

export function ItineraryRow({
  item,
  isFirst,
  isLast,
  currency,
  onEdit,
}: {
  item: ItemWithCreator;
  isFirst: boolean;
  isLast: boolean;
  currency: string;
  onEdit: (item: ItemWithCreator) => void;
}) {
  const { t, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const Icon = CATEGORY_ICONS[item.category];
  const categoryLabel = t(CATEGORY_LABEL_KEYS[item.category]);
  const title = pickField(item, "title", locale) || categoryLabel;
  const locationName = pickField(item, "locationName", locale) || null;
  const note = pickField(item, "note", locale) || null;
  const mapsUrl = resolveMapsUrl({ mapsUrl: item.mapsUrl, locationName, address: item.address });
  const hasDetail = Boolean(note || item.address || item.bookingRef || item.url);

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveItineraryItemAction(item.id, direction);
    });
  }

  function remove() {
    if (!confirm(t("rowDeleteConfirm", { title }))) return;
    startTransition(async () => {
      await deleteItineraryItemAction(item.id);
    });
  }

  return (
    <div className="border-b border-dashed border-border/70 last:border-b-0">
      <div className="flex items-center gap-2 py-2 text-sm">
        <span className="w-11 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
          {item.startTime ?? "--:--"}
          {item.endTime && <span className="block">{item.endTime}</span>}
        </span>
        <Icon className="size-4 shrink-0 text-accent" aria-label={categoryLabel} />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block truncate font-medium">{title}</span>
          {locationName && !expanded && (
            <span className="block truncate text-xs text-muted-foreground">{locationName}</span>
          )}
        </button>
        {item.cost != null && (
          <span className="hidden shrink-0 font-mono text-xs tabular-nums text-muted-foreground sm:inline">
            {formatCurrency(item.cost, currency)}
          </span>
        )}
        <UserAvatar user={item.createdBy} size="xs" />
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label={t("rowOpenMaps")}
            onClick={(e) => e.stopPropagation()}
          >
            <MapPin className="size-4" />
          </a>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={expanded ? t("rowCollapse") : t("rowExpand")}
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-6 shrink-0 text-muted-foreground" disabled={pending} />}
          >
            <MoreVertical className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="size-3.5" /> {t("rowEdit")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => move("up")} disabled={isFirst}>
              <ArrowUp className="size-3.5" /> {t("rowMoveUp")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => move("down")} disabled={isLast}>
              <ArrowDown className="size-3.5" /> {t("rowMoveDown")}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={remove}>
              <Trash2 className="size-3.5" /> {t("rowDelete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && (
        <div className="space-y-1.5 pb-3 pl-13 text-xs text-muted-foreground">
          {item.cost != null && (
            <p className="font-mono sm:hidden">
              {t("rowEstCostMobile")}
              {formatCurrency(item.cost, currency)}
            </p>
          )}
          {locationName && (
            <p>
              {t("rowLocation")}
              {locationName}
            </p>
          )}
          {item.address && (
            <p>
              {t("rowAddress")}
              {item.address}
            </p>
          )}
          {note && <p className="whitespace-pre-wrap text-foreground/80">{note}</p>}
          {item.bookingRef && (
            <p>
              {t("rowBookingRef")}
              {item.bookingRef}
            </p>
          )}
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent underline">
              <ExternalLink className="size-3" /> {t("rowRelatedUrl")}
            </a>
          )}
          {!hasDetail && <p>{t("rowNoDetail")}</p>}
        </div>
      )}
    </div>
  );
}
