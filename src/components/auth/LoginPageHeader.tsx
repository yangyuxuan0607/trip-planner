"use client";

import { useI18n } from "@/components/i18n/I18nProvider";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";

export function LoginPageHeader() {
  const { t } = useI18n();
  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      <LocaleSwitcher />
      <div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground">{t("loginBrand")}</p>
        <h1 className="mt-1 text-xl font-semibold">{t("loginChooseYourself")}</h1>
      </div>
    </div>
  );
}
