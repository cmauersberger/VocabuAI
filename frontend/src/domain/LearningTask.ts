// Keep in sync with backend/VocabuAI.Domain/LearningTask.cs
import type { FreeTextTaskPayload } from "./FreeTextTaskPayload";
import type { MappingTaskPayload } from "./MappingTaskPayload";
import type { MultipleChoiceTaskPayload } from "./MultipleChoiceTaskPayload";
import { LearningTaskType } from "./LearningTaskType";

export type FreeTextLearningTask = {
  guid: string;
  taskType: LearningTaskType.FreeText;
  payload: FreeTextTaskPayload;
};

export type MultipleChoiceLearningTask = {
  guid: string;
  taskType: LearningTaskType.MultipleChoice;
  payload: MultipleChoiceTaskPayload;
};

export type MappingLearningTask = {
  guid: string;
  taskType: LearningTaskType.Mapping;
  payload: MappingTaskPayload;
};

export type LearningTask =
  | FreeTextLearningTask
  | MultipleChoiceLearningTask
  | MappingLearningTask;
