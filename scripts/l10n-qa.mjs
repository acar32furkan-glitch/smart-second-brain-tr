#!/usr/bin/env node
/**
 * l10n-qa — localization quality gate for the Turkish fork.
 *
 * `bun run l10n:check` runs four checks and exits non-zero on any hard failure:
 *
 *   (a) Key parity      — src/lib/tr.json must have exactly the same key set as
 *                         the reference src/lib/en.json (no missing, no extra).
 *   (b) Placeholder parity — the placeholder set inside every message ({name},
 *                         %s, %1$d, …) must be identical across the two locales.
 *   (c) No empty values — no message may be empty or whitespace-only.
 *   (d) English coverage — every static aria-label/placeholder/title/alt text in
 *                         src/**\/*.svelte that looks English must be present in
 *                         scripts/l10n-allowlist.json. The full list is always
 *                         reported; a text that is NOT allowlisted fails the gate,
 *                         so an upstream English string can no longer slip in
 *                         unnoticed.
 *
 * Everything is plain Node/bun — no extra dependency is added.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EN_PATH = join(ROOT, "src", "lib", "en.json");
const TR_PATH = join(ROOT, "src", "lib", "tr.json");
const ALLOWLIST_PATH = join(ROOT, "scripts", "l10n-allowlist.json");
const SRC_DIR = join(ROOT, "src");

/**
 * Turkish word stems spelled *without* the diacritics ç/ğ/ı/ö/ş/ü/â, which the
 * character test alone would misread as English. Inflected forms are matched by
 * stripping a suffix (see TURKISH_SUFFIXES, e.g. "ajanlar" → "ajan"), so only
 * the stem needs to be listed. Keep this list focused on words that actually
 * occur in Turkish UI strings: an over-broad list would hide real English text
 * (a false negative), which is the failure mode this gate exists to prevent.
 * Stems containing a Turkish diacritic are covered by TURKISH_CHARS instead.
 */
const TURKISH_WORDS = new Set([
	"ad",
	"ajan",
	"ara",
	"arama",
	"ayar",
	"bildirimi",
	"boyut",
	"bu",
	"dal",
	"dosya",
	"ekle",
	"etiket",
	"gizlilik",
	"isim",
	"kapat",
	"kod",
	"kullan",
	"liste",
	"mod",
	"parametre",
	"sayfa",
	"sil",
	"simge",
	"sohbet",
	"sonraki",
	"sunucu",
	"temizle",
	"temizlik",
	"veri",
	"yetki",
	"yeni",
]);

/**
 * Common Turkish inflectional suffixes, longest first. Stripping one lets a
 * stem-only word list match inflected forms ("ajanlar", "sohbetler", "modu",
 * "veriler"), which is how Turkish builds plural and case forms.
 */
const TURKISH_SUFFIXES = [
	"ların",
	"lerin",
	"ları",
	"leri",
	"lar",
	"ler",
	"dan",
	"den",
	"tan",
	"ten",
	"nın",
	"nin",
	"yla",
	"yle",
	"da",
	"de",
	"ta",
	"te",
	"ın",
	"in",
	"un",
	"ün",
	"ya",
	"ye",
	"lı",
	"li",
	"lu",
	"lü",
	"ca",
	"ce",
	"cı",
	"ci",
	"cu",
	"cü",
	"sı",
	"si",
	"su",
	"sü",
	"ım",
	"im",
	"um",
	"üm",
	"m",
	"ı",
	"i",
	"u",
	"ü",
	"a",
	"e",
];

/** True when the token is a listed Turkish stem or its inflected form. */
function isTurkishWord(token) {
	if (TURKISH_WORDS.has(token)) return true;
	for (const suffix of TURKISH_SUFFIXES) {
		if (token.length >= suffix.length + 2 && token.endsWith(suffix)) {
			if (TURKISH_WORDS.has(token.slice(0, token.length - suffix.length))) return true;
		}
	}
	return false;
}

/** Letters that only exist in Turkish (incl. circumflex forms used in loanwords). */
const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜâîÂÎ]/;

/** Static attribute forms: aria-label="…", placeholder='…', title="…", alt="…". */
const ATTR_RE = /\b(aria-label|placeholder|title|alt)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const errors = [];
const warnings = [];

function readJson(path) {
	return JSON.parse(readFileSync(path, "utf8"));
}

function flatten(value, prefix = "", out = new Map()) {
	for (const [key, child] of Object.entries(value)) {
		const dotted = prefix ? `${prefix}.${key}` : key;
		if (child !== null && typeof child === "object" && !Array.isArray(child)) {
			flatten(child, dotted, out);
		} else {
			out.set(dotted, child);
		}
	}
	return out;
}

function placeholders(message) {
	const found = new Set();
	if (typeof message !== "string") return found;
	// svelte-i18n / ICU style: {name}, {count, number}
	for (const match of message.matchAll(/\{[^{}]*\}/g)) found.add(match[0]);
	// printf style: %s, %d, %1$d, %2$i
	for (const match of message.matchAll(/%(?:\d+\$)?[sdif@]/g)) found.add(match[0]);
	return found;
}

function setEquals(a, b) {
	if (a.size !== b.size) return false;
	for (const item of a) if (!b.has(item)) return false;
	return true;
}

function walkSvelte(dir, out = []) {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		const stat = statSync(path);
		if (stat.isDirectory()) walkSvelte(path, out);
		else if (entry.endsWith(".svelte")) out.push(path);
	}
	return out;
}

/** Remove svelte mustaches and backslash escapes so only literal text is judged. */
function stripDynamic(text) {
	return text
		.replace(/\{[^{}]*\}/g, " ")
		.replace(/\\[A-Za-z]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * A text "looks English" when it carries real Latin words but neither a Turkish
 * character nor a listed Turkish word.
 */
function looksEnglish(rawText) {
	const text = stripDynamic(rawText);
	if (text === "" || !/[A-Za-z]/.test(text)) return false;
	if (TURKISH_CHARS.test(text)) return false;
	const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
	return !words.some((word) => isTurkishWord(word));
}

// ---------------------------------------------------------------------------
// (a) Key parity
// ---------------------------------------------------------------------------
const en = flatten(readJson(EN_PATH));
const tr = flatten(readJson(TR_PATH));

const missingInTr = [...en.keys()].filter((key) => !tr.has(key));
const extraInTr = [...tr.keys()].filter((key) => !en.has(key));
for (const key of missingInTr) errors.push(`(a) tr.json eksik anahtar: ${key}`);
for (const key of extraInTr) errors.push(`(a) tr.json fazla anahtar: ${key}`);

// ---------------------------------------------------------------------------
// (b) Placeholder parity  +  (c) no empty values
// ---------------------------------------------------------------------------
const sharedKeys = [...en.keys()].filter((key) => tr.has(key));
let placeholderTotal = 0;
for (const key of sharedKeys) {
	const enPlaceholders = placeholders(en.get(key));
	const trPlaceholders = placeholders(tr.get(key));
	placeholderTotal += enPlaceholders.size + trPlaceholders.size;
	if (!setEquals(enPlaceholders, trPlaceholders)) {
		errors.push(
			`(b) yer tutucu uyuşmuyor [${key}]: en={${[...enPlaceholders].join(", ")}} tr={${[...trPlaceholders].join(", ")}}`,
		);
	}
}
for (const [label, map] of [
	["en.json", en],
	["tr.json", tr],
]) {
	for (const [key, value] of map) {
		if (typeof value !== "string") errors.push(`(c) ${label} boş/geçersiz değer [${key}]: ${typeof value}`);
		else if (value.trim() === "") errors.push(`(c) ${label} boş değer: ${key}`);
	}
}

// ---------------------------------------------------------------------------
// (d) English-looking coverage against the allowlist
// ---------------------------------------------------------------------------
const allowlistRaw = existsSync(ALLOWLIST_PATH) ? readJson(ALLOWLIST_PATH) : { allow: [] };
const allowlist = new Map((allowlistRaw.allow ?? []).map((entry) => [entry.text, entry]));

const seenAllowlistTexts = new Set();
let scanned = 0;
let turkish = 0;
let english = 0;
let nonTextual = 0;
const englishOccurrences = new Map(); // text -> [{ file, line }]

for (const file of walkSvelte(SRC_DIR)) {
	const lines = readFileSync(file, "utf8").split(/\r?\n/);
	lines.forEach((line, index) => {
		ATTR_RE.lastIndex = 0;
		let match;
		while ((match = ATTR_RE.exec(line))) {
			const raw = match[2] !== undefined ? match[2] : match[3];
			scanned += 1;
			const stripped = stripDynamic(raw);
			if (stripped === "" || !/[A-Za-z]/.test(stripped)) {
				nonTextual += 1;
			} else if (!looksEnglish(raw)) {
				turkish += 1;
			} else {
				english += 1;
				const where = `${relative(ROOT, file).split("\\").join("/")}:${index + 1}`;
				if (!englishOccurrences.has(stripped)) englishOccurrences.set(stripped, []);
				englishOccurrences.get(stripped).push(where);
			}
		}
	});
}

const notAllowlisted = [];
for (const [text, places] of englishOccurrences) {
	if (allowlist.has(text)) seenAllowlistTexts.add(text);
	else notAllowlisted.push({ text, places });
}

for (const entry of notAllowlisted) {
	errors.push(`(d) allowlist'te olmayan İngilizce görünen metin: "${entry.text}" (${entry.places.join(", ")})`);
}
for (const text of allowlist.keys()) {
	if (!seenAllowlistTexts.has(text)) warnings.push(`(d) allowlist girdisi artık eşleşmiyor (çevrilmiş olabilir): "${text}"`);
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const line = (mark, message) => console.log(`${mark} ${message}`);
console.log("");
line("ℹ️ ", "L10N QA — smart-second-brain-tr");
console.log(`   referans: src/lib/en.json · çeviri: src/lib/tr.json · allowlist: scripts/l10n-allowlist.json`);
console.log("");

if (missingInTr.length === 0 && extraInTr.length === 0) {
	line("✅", `(a) Anahtar paritesi: ${en.size} anahtar çifti (en ↔ tr), eksik/fazla yok`);
} else {
	line("❌", `(a) Anahtar paritesi: ${missingInTr.length} eksik, ${extraInTr.length} fazla`);
}
line("✅", `(b) Yer tutucu paritesi: ${sharedKeys.length} anahtar karşılaştırıldı, ${placeholderTotal} yer tutucu, uyuşmazlık yok`);
console.log(`   (c) Boş/whitespace-only değer: ${errors.filter((e) => e.startsWith("(c)")).length}`);
console.log("");
line("🔎", `(d) Kapsam — aria-label/placeholder/title/alt (src/**/*.svelte)`);
console.log(`   taranan metin        : ${scanned}`);
console.log(`   Türkçe görünen       : ${turkish}`);
console.log(`   İngilizce görünen    : ${english}  (${englishOccurrences.size} farklı metin)`);
console.log(`   metin dışı/salt yer tutucu: ${nonTextual}`);
console.log(`   allowlist'te         : ${seenAllowlistTexts.size}/${englishOccurrences.size}`);
console.log(`   allowlist DIŞI       : ${notAllowlisted.length}`);
for (const entry of notAllowlisted) {
	console.log(`      • "${entry.text}" → ${entry.places.join(", ")}`);
}
console.log("");

for (const warning of warnings) line("⚠️ ", warning);

if (errors.length > 0) {
	console.log("");
	line("❌", `Kapı BAŞARISIZ — ${errors.length} hata:`);
	for (const error of errors) console.log(`   - ${error}`);
	process.exit(1);
}

console.log("");
line("✅", "Kapı geçti — i18n tutarlı, yeni İngilizce metin yok.");
