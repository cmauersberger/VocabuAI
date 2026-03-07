export type SessionSummary = {
  taskCount: number;
  incorrectAnswers: number;
  totalAnswers: number;
  durationSeconds: number;
  startedAt: number | null;
  endedAt: number | null;
};

export type MappingAnswerResult = { flashCardId: number; isCorrect: boolean };
