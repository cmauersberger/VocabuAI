import React from "react";
import type { LearningTask } from "../../domain/LearningTask";
import type { UserSettingsDto } from "../../domain/dtos/UserSettingsDto";
import { LearningTaskType } from "../../domain/LearningTaskType";
import type { MappingAnswerResult } from "./types";
import LearnFreeTextTask from "./LearnFreeTextTask";
import LearnMappingTask from "./LearnMappingTask";
import LearnMultipleChoiceTask from "./LearnMultipleChoiceTask";

type Props = {
  task: LearningTask;
  authToken: string;
  userSettings: UserSettingsDto | null;
  onAnswer: (isCorrect: boolean, mappingAnswers?: MappingAnswerResult[]) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnTaskRenderer({
  task,
  authToken,
  userSettings,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: Props) {
  switch (task.taskType) {
    case LearningTaskType.FreeText:
      return (
        <LearnFreeTextTask
          authToken={authToken}
          userSettings={userSettings}
          payload={task.payload}
          onAnswer={onAnswer}
          disabled={disabled}
          showCorrectAnswer={showCorrectAnswer}
          onContinue={onContinue}
          onCheat={onCheat}
        />
      );
    case LearningTaskType.MultipleChoice:
      return (
        <LearnMultipleChoiceTask
          authToken={authToken}
          userSettings={userSettings}
          payload={task.payload}
          onAnswer={onAnswer}
          disabled={disabled}
          showCorrectAnswer={showCorrectAnswer}
          onContinue={onContinue}
          onCheat={onCheat}
        />
      );
    case LearningTaskType.Mapping:
      return (
        <LearnMappingTask
          authToken={authToken}
          userSettings={userSettings}
          items={task.payload.items}
          onAnswer={onAnswer}
          disabled={disabled}
          showCorrectAnswer={showCorrectAnswer}
          onContinue={onContinue}
          onCheat={onCheat}
        />
      );
    default:
      return null;
  }
}
