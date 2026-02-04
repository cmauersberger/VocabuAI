// Keep in sync with backend/VocabuAI.Application/Learning/Generation/GenerateTextRequestDto.cs
import { LanguageLevel } from "../LanguageLevel";
import { GrammarConceptId } from "../GrammarConceptId";
import { Language } from "../Language";
import { TextStyle } from "../TextStyle";
import type { AiProvider } from "../AiProvider";

export type GenerateTextRequestDto = {
  targetLanguage: Language;
  minWordCount: number;
  maxWordCount: number;
  allowedGrammar: GrammarConceptId[];
  forbiddenGrammar: GrammarConceptId[];
  style: TextStyle;
  languageLevel: LanguageLevel;
  provider?: AiProvider | null;
};
