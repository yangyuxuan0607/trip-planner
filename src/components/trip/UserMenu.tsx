"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronDown, History, LogOut, Settings, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/trip/UserAvatar";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { useI18n } from "@/components/i18n/I18nProvider";
import { logoutAction } from "@/app/actions/auth";
import type { PublicUser } from "@/lib/types";

export function UserMenu({
  currentUser,
  onActivityLog,
  onSettings,
}: {
  currentUser: PublicUser;
  onActivityLog: () => void;
  onSettings: () => void;
}) {
  const { t } = useI18n();
  const [pending, startTransition] = useTransition();

  function logout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex shrink-0 items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <UserAvatar user={currentUser} size="sm" />
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          {t("userMenuCurrentlyIs", { name: currentUser.name })}
        </div>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground">{t("userMenuLanguage")}</span>
          <LocaleSwitcher />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/login" />}>
          <Users className="size-3.5" /> {t("userMenuSwitch")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onActivityLog}>
          <History className="size-3.5" /> {t("userMenuActivityLog")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSettings}>
          <Settings className="size-3.5" /> {t("userMenuSettings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout} disabled={pending} variant="destructive">
          <LogOut className="size-3.5" /> {t("userMenuLogout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
