"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setSessionCookie, clearSessionCookie } from "@/lib/session";
import { writeLog } from "@/lib/activityLog";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/locale";

export async function loginAction(userId: string, pin: string, locale?: string): Promise<{ error?: string }> {
  const l: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const t = dictionaries[l];

  if (!/^\d{4}$/.test(pin)) return { error: t.loginPinErrorFormat };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: t.loginPinErrorNotFound };

  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) return { error: t.loginPinErrorWrong };

  await setSessionCookie(user.id);

  const trip = await prisma.trip.findFirst();
  if (trip) {
    await writeLog({
      tripId: trip.id,
      userId: user.id,
      action: "LOGIN",
      targetType: "User",
      targetName: user.name,
      summary: `${user.name} 登入`,
    });
  }

  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
