import React from "react";
import type { LearningTask } from "../../domain/LearningTask";
import { LearningTaskType } from "../../domain/LearningTaskType";
import type { MappingAnswerResult } from "./types";
import LearnFreeTextTask from "./LearnFreeTextTask";
import LearnMappingTask from "./LearnMappingTask";
import LearnMultipleChoiceTask from "./LearnMultipleChoiceTask";

type Props = {
  task: LearningTask;
  onAnswer: (isCorrect: boolean, mappingAnswers?: MappingAnswerResult[]) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnTaskRenderer({
  task,
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
