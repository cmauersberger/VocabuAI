import type { PronunciationLookupResponseDto } from "../domain/dtos/PronunciationLookupResponseDto";

const lookupCache = new Map<string, Promise<PronunciationLookupResponseDto>>();

export async function lookupPronunciationAsync(
  apiBaseUrl: string,
  authToken: string,
  term: string,
  languageCode: string
): Promise<PronunciationLookupResponseDto> {
  const normalizedTerm = term.trim();
  const normalizedLanguageCode = languageCode.trim().toLowerCase();
  const cacheKey = `${normalizedLanguageCode}:${normalizedTerm}`;

  const cached = lookupCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = fetch(
    `${apiBaseUrl}/pronunciation/lookup?term=${encodeURIComponent(
      normalizedTerm
    )}&languageCode=${encodeURIComponent(normalizedLanguageCode)}`,
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  )
    .then(async (response) => {
      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(errorPayload?.message || "Unable to load pronunciation.");
      }

      return (await response.json()) as PronunciationLookupResponseDto;
    })
    .catch((error) => {
      lookupCache.delete(cacheKey);
      throw error;
    });

  lookupCache.set(cacheKey, pending);
  return pending;
}
