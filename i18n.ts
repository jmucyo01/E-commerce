import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "rw"] as const;
export const defaultLocale = "en" as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = (locales as readonly string[]).includes(requested ?? "")
    ? (requested as (typeof locales)[number])
    : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});