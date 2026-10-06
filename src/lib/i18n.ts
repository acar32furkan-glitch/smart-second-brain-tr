import { getLanguage } from "obsidian";
import { addMessages, init } from "svelte-i18n";

import en from "./en.json";
import tr from "./tr.json";

/**
 * Locales shipped with this fork. This list is the single place to register a
 * new language: add the JSON import above, an entry here, and a matching entry
 * in {@link MESSAGES}; `scripts/l10n-qa.mjs` enforces that every locale stays in
 * key parity with the reference (`en`).
 */
export const SUPPORTED_LOCALES = ["en", "tr"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Reference locale; every other locale is checked against it. */
export const DEFAULT_LOCALE: SupportedLocale = "en";

/**
 * Shape of a locale message tree — structurally compatible with svelte-i18n's
 * (unexported) `LocaleDictionary`, so `addMessages` accepts it without a cast.
 */
type MessageValue = string | null | MessageDictionary | Array<string | MessageDictionary>;
interface MessageDictionary {
	[key: string]: MessageValue;
}

/** Messages per shipped locale, keyed by the base language subtag. */
const MESSAGES: Record<SupportedLocale, MessageDictionary> = {
	en,
	tr,
};

/**
 * Map Obsidian's `getLanguage()` value to a shipped locale. Obsidian reports
 * BCP-47-ish tags such as `"en"`, `"en-GB"`, `"tr"` or `"tr-TR"`; messages are
 * keyed on the base subtag only, so `"tr-TR"` resolves to `"tr"`. Any language
 * we do not ship falls back to {@link DEFAULT_LOCALE}.
 */
export function resolveLocale(language: string | null | undefined): SupportedLocale {
	const base = (language ?? "").trim().toLowerCase().split(/[-_]/)[0];
	return (SUPPORTED_LOCALES as readonly string[]).includes(base) ? (base as SupportedLocale) : DEFAULT_LOCALE;
}

for (const locale of SUPPORTED_LOCALES) {
	addMessages(locale, MESSAGES[locale]);
}

void init({
	fallbackLocale: DEFAULT_LOCALE,
	initialLocale: resolveLocale(getLanguage()),
});
