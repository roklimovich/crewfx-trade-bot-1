import { cookies } from 'next/headers';
import { en } from './locales/en';
import { ru } from './locales/ru';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './config';
import type { Messages } from './locales/en';

const dictionaries: Record<Locale, Messages> = { en, ru };

/** Reads the active locale from the NEXT_LOCALE cookie. Server Components only. */
export function getServerLocale(): Locale {
  const cookieValue = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(cookieValue) ? cookieValue : DEFAULT_LOCALE;
}

/** Full message dictionary for the current request's locale. Server Components only. */
export function getMessages(): Messages {
  return dictionaries[getServerLocale()];
}
