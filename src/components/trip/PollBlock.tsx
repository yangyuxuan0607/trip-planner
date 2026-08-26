"use client";

import { useTransition } from "react";
import { CheckCircle2, MapPin, MoreVertical, Pencil, Trash2, Vote as VoteIcon } from "lucide-react";
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
import { formatCurrency } from "@/lib/money";
import { voteAction, deletePollAction } from "@/app/actions/poll";
import type { PollWithOptions, PublicUser } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PollBlock({
  poll,
  members,
  currentUserId,
  currency,
  onEdit,
}: {
  poll: PollWithOptions;
  members: PublicUser[];
  currentUserId: string;
  currency: string;
  onEdit: (poll: PollWithOptions) => void;
}) {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const question = pickField(poll, "question", locale);

  const votedUserIds = new Set(poll.options.flatMap((o) => o.votes.map((v) => v.userId)));
  const completed = members.length > 0 && members.every((m) => votedUserIds.has(m.id));
  const maxVotes = Math.max(0, ...poll.options.map((o) => o.votes.length));
  const myVote = poll.options.find((o) => o.votes.some((v) => v.userId === currentUserId));

  function cast(optionId: string) {
    startTransition(async () => {
      await voteAction(poll.id, optionId);
    });
  }

  function remove() {
    if (!confirm(t("pollDeleteConfirm", { question }))) return;
    startTransition(async () => {
      await deletePollAction(poll.id);
    });
  }

  return (
    <div className="rounded-sm bg-secondary/40 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          <VoteIcon className="mt-0.5 size-3.5 shrink-0 text-accent" />
          <p className="text-sm font-medium">{question}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {completed && (
            <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
              <CheckCircle2 className="size-3" /> {t("pollCompleted")}
            </span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-6 text-muted-foreground" disabled={pending} />}
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(poll)}>
                <Pencil className="size-3.5" /> {t("rowEdit")}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={remove}>
                <Trash2 className="size-3.5" /> {t("rowDelete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-1.5">
        {poll.options.map((option) => {
          const label = pickField(option, "label", locale);
          const note = pickField(option, "note", locale) || null;
          const voters = option.votes.map((v) => v.user);
          const isMine = myVote?.id === option.id;
          const isLeading = maxVotes > 0 && option.votes.length === maxVotes;
          return (
            <button
              key={option.id}
              type="button"
              disabled={pending}
              onClick={() => cast(option.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm border px-2 py-1.5 text-left text-xs transition",
                isMine ? "border-accent bg-accent/10" : "border-border/70 bg-card hover:border-foreground/30",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1">
                  <span className="truncate font-medium">{label}</span>
                  {isLeading && <span className="shrink-0 text-[10px] text-accent">{t("pollLeading")}</span>}
                </span>
                {note && <span className="block truncate text-muted-foreground">{note}</span>}
              </span>
              {option.price != null && (
                <span className="shrink-0 font-mono tabular-nums text-muted-foreground">{formatCurrency(option.price, currency)}</span>
              )}
              {option.mapsUrl && (
                <a
                  href={option.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
                >
                  <MapPin className="size-3.5" />
                </a>
              )}
              <span className="flex shrink-0 -space-x-1">
                {voters.map((v) => (
                  <UserAvatar key={v.id} user={v} size="xs" className="ring-2 ring-card" />
                ))}
              </span>
              <span className="w-4 shrink-0 text-right font-mono tabular-nums text-muted-foreground">
                {option.votes.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
