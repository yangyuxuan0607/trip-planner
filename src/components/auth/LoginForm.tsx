"use client";

import { useState, useTransition } from "react";
import { Delete } from "lucide-react";
import { loginAction } from "@/app/actions/auth";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/utils";

type LoginUser = { id: string; name: string; avatarText: string; color: string };

export function LoginForm({ users }: { users: LoginUser[] }) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<LoginUser | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pickUser(user: LoginUser) {
    setSelected(user);
    setPin("");
    setError(null);
  }

  function goBack() {
    setSelected(null);
    setPin("");
    setError(null);
  }

  function pressDigit(digit: string) {
    if (pending) return;
    setError(null);
    setPin((prev) => {
      const next = prev.length < 4 ? prev + digit : prev;
      if (next.length === 4 && selected) submit(selected.id, next);
      return next;
    });
  }

  function backspace() {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  }

  function submit(userId: string, value: string) {
    startTransition(async () => {
      const res = await loginAction(userId, value, locale);
      if (res?.error) {
        setError(res.error);
        setPin("");
      }
    });
  }

  if (!selected) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => pickUser(u)}
            className="flex flex-col items-center gap-2 rounded-md border border-border bg-card p-4 transition hover:border-foreground/30 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          >
            <UserAvatar user={u} size="lg" />
            <span className="text-sm font-medium">{u.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={goBack}
        className="flex flex-col items-center gap-2 text-sm text-muted-foreground"
      >
        <UserAvatar user={selected} size="lg" />
        <span>
          {selected.name} <span className="underline">{t("loginChangePerson")}</span>
        </span>
      </button>

      <div className="flex gap-3" aria-live="polite">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border border-foreground/30",
              i < pin.length && "bg-foreground",
            )}
          />
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button
            key={d}
            type="button"
            disabled={pending}
            onClick={() => pressDigit(d)}
            className="flex size-14 items-center justify-center rounded-full font-mono text-lg tabular-nums transition hover:bg-secondary active:bg-secondary disabled:opacity-50"
          >
            {d}
          </button>
        ))}
        <span />
        <button
          type="button"
          disabled={pending}
          onClick={() => pressDigit("0")}
          className="flex size-14 items-center justify-center rounded-full font-mono text-lg tabular-nums transition hover:bg-secondary active:bg-secondary disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={backspace}
          className="flex size-14 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary active:bg-secondary disabled:opacity-50"
          aria-label={t("rowDelete")}
        >
          <Delete className="size-5" />
        </button>
      </div>
    </div>
  );
}
