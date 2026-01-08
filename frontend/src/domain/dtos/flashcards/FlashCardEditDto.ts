// Keep in sync with backend/VocabuAI.Api/Dtos/FlashCards/FlashCardEditDto.cs
export type FlashCardEditDto = {
  id: number;
  foreignLanguage: string;
  localLanguage: string;
  foreignLanguageCode: string;
  localLanguageCode: string;
  synonyms?: string | null;
  annotation?: string | null;
};
