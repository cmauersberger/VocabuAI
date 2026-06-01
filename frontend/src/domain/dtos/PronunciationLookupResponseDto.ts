// Keep in sync with backend/VocabuAI.Api/Dtos/PronunciationLookupResponseDto.cs
export type PronunciationLookupResponseDto = {
  term: string;
  languageCode: string;
  isAvailable: boolean;
  audioUrl: string | null;
  attributionUrl: string | null;
  licenseShortName: string | null;
  creator: string | null;
  credit: string | null;
  source: string | null;
  message: string | null;
};
