// Keep in sync with backend/VocabuAI.Api/Dtos/FlashCards/FlashCardDto.cs
export type FlashCardDto = {
  id: number;
  foreignLanguage: string;
  localLanguage: string;
  synonyms?: string | null;
  annotation?: string | null;
  box: number;
  lastAnsweredAt?: string | null;
  dateTimeCreated: string;
  dateTimeUpdated: string;
};
