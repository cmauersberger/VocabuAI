const ARABIC_DIACRITICS_REGEX = /[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]/g;
const WORD_CHAR_REGEX = /[0-9A-Za-z\u00C0-\u024F\u1E00-\u1EFF\u0600-\u06FF]/;

export function stripArabicDiacritics(value: string): string {
  // Normalize to FormD to separate combining marks before stripping.
  const normalized = value.normalize("NFD");

  // Arabic diacritics and related marks to ignore for matching.
  // Tanwin Fath (U+064B)
  // Tanwin Damm (U+064C)
  // Tanwin Kasr (U+064D)
  // Fatha (U+064E)
  // Damma (U+064F)
  // Kasra (U+0650)
  // Shadda (U+0651)
  // Sukun (U+0652)
  // Superscript Alif (U+0670)
  // Tatweel (U+0640)
  // Quranic/extended marks (U+06D6-U+06ED)
  return normalized.replace(ARABIC_DIACRITICS_REGEX, "");
}

export function isArabicLanguageCode(languageCode?: string | null): boolean {
  const normalized = languageCode?.trim().toLowerCase() ?? "";
  return normalized === "ar" || normalized.startsWith("ar-");
}

export function normalizeTermForDuplicateComparison(
  value: string,
  languageCode?: string | null
): string {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return "";
  if (!isArabicLanguageCode(languageCode)) return normalized;
  return stripArabicDiacritics(normalized);
}

function isWordCharacter(character: string): boolean {
  return WORD_CHAR_REGEX.test(character);
}

export function containsAsWordBoundedPart(
  value: string,
  part: string
): boolean {
  if (!value || !part || part.length > value.length) return false;

  let fromIndex = 0;
  while (fromIndex < value.length) {
    const start = value.indexOf(part, fromIndex);
    if (start < 0) return false;

    const end = start + part.length;
    const before = start > 0 ? value[start - 1] : "";
    const after = end < value.length ? value[end] : "";

    const hasWordBoundaryBefore = !before || !isWordCharacter(before);
    const hasWordBoundaryAfter = !after || !isWordCharacter(after);
    if (hasWordBoundaryBefore && hasWordBoundaryAfter) {
      return true;
    }

    fromIndex = start + 1;
  }

  return false;
}

export function arePotentialDuplicateTerms(
  firstValue: string,
  firstLanguageCode: string | null | undefined,
  secondValue: string,
  secondLanguageCode: string | null | undefined
): boolean {
  const first = normalizeTermForDuplicateComparison(firstValue, firstLanguageCode);
  const second = normalizeTermForDuplicateComparison(
    secondValue,
    secondLanguageCode
  );

  if (!first || !second) return false;
  if (first.length <= second.length) {
    return containsAsWordBoundedPart(second, first);
  }

  return containsAsWordBoundedPart(first, second);
}
