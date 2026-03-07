import { stripArabicDiacritics as stripArabicDiacriticsForComparison } from "../../infrastructure/textNormalization";
import { Language as GenerationLanguage } from "../../domain/Language";
import type { LearningTask } from "../../domain/LearningTask";
import { LearningLanguage } from "../../domain/LearningLanguage";
import { LearningTaskType } from "../../domain/LearningTaskType";

const IGNORE_VOCALIZATION = true;

export type SseEvent = {
  event: string;
  data: string;
};

export function getFlashCardIds(task: LearningTask): number[] {
  switch (task.taskType) {
    case LearningTaskType.FreeText: {
      const payload = task.payload as typeof task.payload & { FlashCardId?: number };
      return [payload.flashCardId ?? payload.FlashCardId ?? 0].filter((id) => id > 0);
    }
    case LearningTaskType.MultipleChoice: {
      const payload = task.payload as typeof task.payload & { FlashCardId?: number };
      return [payload.flashCardId ?? payload.FlashCardId ?? 0].filter((id) => id > 0);
    }
    case LearningTaskType.Mapping: {
      const ids = task.payload.items
        .map((item) => {
          const mapped = item as typeof item & { FlashCardId?: number };
          return mapped.flashCardId ?? mapped.FlashCardId ?? 0;
        })
        .filter((id) => id > 0);
      return Array.from(new Set(ids));
    }
    default:
      return [];
  }
}

export function normalizeFreeTextAnswer(value: string): string {
  const lower = value.trim().toLowerCase();

  if (!IGNORE_VOCALIZATION) return lower;

  return stripArabicDiacritics(lower);
}

export function stripArabicDiacritics(value: string): string {
  return stripArabicDiacriticsForComparison(value);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function parseSseEvent(raw: string): SseEvent {
  const lines = raw.split("\n");
  let eventName = "message";
  const dataLines: string[] = [];

  lines.forEach((line) => {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim() || "message";
      return;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  });

  return { event: eventName, data: dataLines.join("\n") };
}

export function handleSseBuffer(
  buffer: string,
  onEvent: (event: SseEvent) => void
): string {
  const parts = buffer.split("\n\n");
  const remaining = parts.pop() ?? "";
  parts.forEach((part) => {
    if (part.trim()) {
      onEvent(parseSseEvent(part));
    }
  });
  return remaining;
}

export function getGenerationLanguageFromCode(
  code: string | null | undefined
): GenerationLanguage | null {
  if (!code) return null;
  const normalized = code.trim().toLowerCase();
  if (normalized === "ar" || normalized.startsWith("ar-")) {
    return GenerationLanguage.Arabic;
  }
  if (normalized === "en" || normalized.startsWith("en-")) {
    return GenerationLanguage.English;
  }
  return null;
}

export function getLanguageLabel(language: LearningLanguage): string {
  switch (language) {
    case LearningLanguage.Foreign:
      return "Foreign";
    case LearningLanguage.Local:
      return "Local";
    default:
      return "Unknown";
  }
}

export function removeLastTaskByGuid(
  tasks: LearningTask[],
  guid: string
): LearningTask[] {
  let lastIndex = -1;
  for (let i = tasks.length - 1; i >= 0; i -= 1) {
    if (tasks[i].guid === guid) {
      lastIndex = i;
      break;
    }
  }
  if (lastIndex <= 0) return tasks;
  const firstIndex = tasks.findIndex((task) => task.guid === guid);
  if (firstIndex === lastIndex) return tasks;
  const copy = [...tasks];
  copy.splice(lastIndex, 1);
  return copy;
}
