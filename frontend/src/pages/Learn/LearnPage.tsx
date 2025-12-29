import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import Button from "../../components/Button";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import type { FreeTextTaskPayload } from "../../domain/FreeTextTaskPayload";
import type { LearningMappingItem } from "../../domain/LearningMappingItem";
import type { LearningSession } from "../../domain/LearningSession";
import type { LearningTask } from "../../domain/LearningTask";
import type { MultipleChoiceTaskPayload } from "../../domain/MultipleChoiceTaskPayload";
import { LearningLanguage } from "../../domain/LearningLanguage";
import { LearningSelectionMode } from "../../domain/LearningSelectionMode";
import { LearningTaskType } from "../../domain/LearningTaskType";

type Props = {
  authToken: string;
  onSessionActiveChange?: (active: boolean) => void;
  onExitToOverview?: () => void;
};

type SessionSummary = {
  taskCount: number;
  incorrectAnswers: number;
  totalAnswers: number;
  durationSeconds: number;
  startedAt: number | null;
  endedAt: number | null;
};

type MappingAnswerResult = { flashCardId: number; isCorrect: boolean };

const DEFAULT_TASK_COUNT = 4;
const IGNORE_VOCALIZATION = true;

export default function LearnPage({
  authToken,
  onSessionActiveChange,
  onExitToOverview
}: Props) {
  const apiBaseUrl = getApiBaseUrl();

  const [session, setSession] = React.useState<LearningSession | null>(null);
  const [tasks, setTasks] = React.useState<LearningTask[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [completedGuids, setCompletedGuids] = React.useState<Set<string>>(
    () => new Set()
  );
  const [status, setStatus] = React.useState<string | null>(null);
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [summary, setSummary] = React.useState<SessionSummary | null>(null);
  const [feedback, setFeedback] = React.useState<null | {
    correct: boolean;
    message: string;
  }>(null);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const sendFlashcardAnswer = React.useCallback(
    async (
      task: LearningTask,
      isCorrect: boolean,
      mappingAnswers?: MappingAnswerResult[]
    ) => {
      const mappingPayload =
        task.taskType === LearningTaskType.Mapping &&
        mappingAnswers &&
        mappingAnswers.length > 0
          ? mappingAnswers
          : null;
      const flashCardIds = (
        mappingPayload
          ? mappingPayload.map((answer) => answer.flashCardId)
          : getFlashCardIds(task)
      ).filter((id) => id > 0);
      if (flashCardIds.length === 0) return;

      try {
        await Promise.all(
          flashCardIds.map((flashCardId) =>
            fetch(`${apiBaseUrl}/learning-session/flashcardAnswered`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                flashCardId,
                learningTaskType: task.taskType,
                isCorrect: mappingPayload
                  ? Boolean(
                      mappingPayload.find(
                        (answer) => answer.flashCardId === flashCardId
                      )?.isCorrect
                    )
                  : isCorrect
              })
            })
          )
        );
      } catch {
        // Ignore answer sync failures to avoid blocking the learning flow.
      }
    },
    [apiBaseUrl, authToken]
  );

  const currentTask =
    session && currentIndex < tasks.length ? tasks[currentIndex] : null;

  const completedCount = React.useMemo(() => {
    return tasks.filter((task) => completedGuids.has(task.guid)).length;
  }, [tasks, completedGuids]);

  const progress = tasks.length === 0 ? 0 : completedCount / tasks.length;

  const resetSessionState = React.useCallback(() => {
    setSession(null);
    setTasks([]);
    setCurrentIndex(0);
    setCompletedGuids(new Set());
    setStartedAt(null);
    setFeedback(null);
    setIsAdvancing(false);
  }, []);

  const startSession = async () => {
    setStatus("Starting session...");
    setSummary(null);
    setTotalAnswers(0);
    setIncorrectAnswers(0);

    try {
      const response = await fetch(`${apiBaseUrl}/learningSession/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ taskCount: DEFAULT_TASK_COUNT })
      });

      if (!response.ok) {
        setStatus("Unable to start learning.");
        return;
      }

      const payload = (await response.json()) as LearningSession;
      setSession(payload);
      setTasks(payload.tasks);
      setCurrentIndex(0);
      setCompletedGuids(new Set());
      setStartedAt(Date.now());
      setStatus(null);
      onSessionActiveChange?.(true);
    } catch (error) {
      setStatus("Unable to reach the API.");
    }
  };

  const [totalAnswers, setTotalAnswers] = React.useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = React.useState(0);

  const recordAnswer = React.useCallback(
    (isCorrect: boolean, mappingAnswers?: MappingAnswerResult[]) => {
      if (!currentTask) return;

      void sendFlashcardAnswer(currentTask, isCorrect, mappingAnswers);

      const nextTasks = isCorrect ? tasks : [...tasks, currentTask];
      const nextCompletedGuids = new Set(completedGuids);
      if (isCorrect) {
        nextCompletedGuids.add(currentTask.guid);
      }

      const nextTotalAnswers = totalAnswers + 1;
      const nextIncorrectAnswers = incorrectAnswers + (isCorrect ? 0 : 1);

      setTasks(nextTasks);
      setCompletedGuids(nextCompletedGuids);
      setTotalAnswers(nextTotalAnswers);
      setIncorrectAnswers(nextIncorrectAnswers);

      const completedTaskCount = nextTasks.filter((task) =>
        nextCompletedGuids.has(task.guid)
      ).length;

      if (completedTaskCount >= nextTasks.length) {
        const finishedAt = Date.now();
        setSummary({
          taskCount: completedTaskCount,
          incorrectAnswers: nextIncorrectAnswers,
          totalAnswers: nextTotalAnswers,
          durationSeconds: startedAt
            ? Math.max(0, Math.round((finishedAt - startedAt) / 1000))
            : 0,
          startedAt,
          endedAt: finishedAt
        });
        resetSessionState();
        setTotalAnswers(0);
        setIncorrectAnswers(0);
        onSessionActiveChange?.(false);
        return;
      }

      setFeedback({
        correct: isCorrect,
        message: isCorrect ? "Correct." : "Incorrect."
      });
      setIsAdvancing(true);

      setTimeout(() => {
        setFeedback(null);
        setIsAdvancing(false);
        setCurrentIndex((prev) => prev + 1);
      }, 700);
    },
    [
      completedGuids,
      currentTask,
      incorrectAnswers,
      onSessionActiveChange,
      resetSessionState,
      sendFlashcardAnswer,
      startedAt,
      tasks,
      totalAnswers
    ]
  );

  const abortSession = () => {
    resetSessionState();
    setSummary(null);
    setTotalAnswers(0);
    setIncorrectAnswers(0);
    onSessionActiveChange?.(false);
    onExitToOverview?.();
  };

  const finishResult = () => {
    setSummary(null);
    setTotalAnswers(0);
    setIncorrectAnswers(0);
    onExitToOverview?.();
  };

  if (!session && !summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Learning</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <Button label="Start learning" onClick={startSession} />
      </View>
    );
  }

  if (summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Session complete</Text>
        <View style={styles.resultCard}>
          <Text style={styles.resultItem}>
            Tasks completed: {summary.taskCount}
          </Text>
          <Text style={styles.resultItem}>
            Incorrect answers: {summary.incorrectAnswers}
          </Text>
          <Text style={styles.resultItem}>
            Total time: {summary.durationSeconds}s
          </Text>
        </View>
        <Button label="Back to overview" onClick={finishResult} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sessionHeader}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View
            style={[styles.progressRemaining, { flex: Math.max(0, 1 - progress) }]}
          />
        </View>
        <Pressable onPress={abortSession} style={styles.abortButton}>
          <Text style={styles.abortText}>Abort learning</Text>
        </Pressable>
      </View>

      <View style={styles.sessionMeta}>
        <Text style={styles.metaText}>
          Progress: {completedCount}/{tasks.length}
        </Text>
        <Text style={styles.metaText}>Incorrect: {incorrectAnswers}</Text>
      </View>

      {currentTask ? (
        <TaskRenderer
          key={currentTask.guid}
          task={currentTask}
          onAnswer={recordAnswer}
          disabled={isAdvancing}
        />
      ) : null}

      {feedback ? (
        <Text
          style={[
            styles.feedback,
            feedback.correct ? styles.correct : styles.incorrect
          ]}
        >
          {feedback.message}
        </Text>
      ) : null}
    </View>
  );
}

type TaskRendererProps = {
  task: LearningTask;
  onAnswer: (isCorrect: boolean, mappingAnswers?: MappingAnswerResult[]) => void;
  disabled: boolean;
};

function TaskRenderer({ task, onAnswer, disabled }: TaskRendererProps) {
  switch (task.taskType) {
    case LearningTaskType.FreeText:
      return (
        <FreeTextTask
          payload={task.payload}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case LearningTaskType.MultipleChoice:
      return (
        <MultipleChoiceTask
          payload={task.payload}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    case LearningTaskType.Mapping:
      return (
        <MappingTask
          items={task.payload.items}
          onAnswer={onAnswer}
          disabled={disabled}
        />
      );
    default:
      return null;
  }
}

function getFlashCardIds(task: LearningTask): number[] {
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

type FreeTextTaskProps = {
  payload: FreeTextTaskPayload;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
};

function FreeTextTask({ payload, onAnswer, disabled }: FreeTextTaskProps) {
  const [value, setValue] = React.useState("");

  const checkAnswer = () => {
    if (disabled) return;
    const trimmed = value.trim();
    if (!trimmed) return;

    const isCorrect = payload.answers.some((answer) => {
      if (!answer.correct) return false;
      const expected = normalizeFreeTextAnswer(answer.value);
      const actual = normalizeFreeTextAnswer(trimmed);
      return expected === actual;
    });

    onAnswer(isCorrect);
    setValue("");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.questionLabel}>
        {getLanguageLabel(payload.question.language)}
      </Text>
      <Text style={styles.questionText}>{payload.question.value}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Type your answer"
        placeholderTextColor="#64748B"
        editable={!disabled}
        onSubmitEditing={checkAnswer}
        returnKeyType="done"
      />
      <Button label="Submit" onClick={checkAnswer} />
    </View>
  );
}

type MultipleChoiceTaskProps = {
  payload: MultipleChoiceTaskPayload;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
};

function MultipleChoiceTask({
  payload,
  onAnswer,
  disabled
}: MultipleChoiceTaskProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const submit = () => {
    if (disabled) return;
    if (selectedIndex === null) return;
    const selected = payload.options[selectedIndex];
    onAnswer(Boolean(selected?.correct));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.questionLabel}>
        {getLanguageLabel(payload.question.language)}
      </Text>
      <Text style={styles.questionText}>{payload.question.value}</Text>
      {payload.selectionMode !== LearningSelectionMode.Single ? null : (
        <View style={styles.optionList}>
          {payload.options.map((option, index) => {
            const selected = index === selectedIndex;
            return (
              <Pressable
                key={`${option.value}-${index}`}
                style={[
                  styles.optionRow,
                  selected ? styles.optionRowSelected : null
                ]}
                onPress={() => setSelectedIndex(index)}
                disabled={disabled}
              >
                <View
                  style={[
                    styles.radio,
                    selected ? styles.radioSelected : null
                  ]}
                />
                <Text style={styles.optionText}>{option.value}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
      <Button label="Submit" onClick={submit} />
    </View>
  );
}

type MappingTaskProps = {
  items: LearningMappingItem[];
  onAnswer: (isCorrect: boolean, mappingAnswers: MappingAnswerResult[]) => void;
  disabled: boolean;
};

function MappingTask({ items, onAnswer, disabled }: MappingTaskProps) {
  const [selectedLeftKey, setSelectedLeftKey] = React.useState<string | null>(
    null
  );
  const [pairs, setPairs] = React.useState<Record<string, string>>({});
  const [leftItems, setLeftItems] = React.useState<
    { key: string; text: LearningMappingItem["left"] }[]
  >([]);
  const [rightItems, setRightItems] = React.useState<
    { key: string; text: LearningMappingItem["right"] }[]
  >([]);

  const correctPairs = React.useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((item, index) => {
      map[`left-${index}`] = `right-${index}`;
    });
    return map;
  }, [items]);

  React.useEffect(() => {
    const left = items.map((item, index) => ({
      key: `left-${index}`,
      text: item.left
    }));
    const right = items.map((item, index) => ({
      key: `right-${index}`,
      text: item.right
    }));
    setLeftItems(shuffle(left));
    setRightItems(shuffle(right));
    setPairs({});
    setSelectedLeftKey(null);
  }, [items]);

  const assignPair = (rightKey: string) => {
    if (!selectedLeftKey) return;
    setPairs((prev) => ({ ...prev, [selectedLeftKey]: rightKey }));
    setSelectedLeftKey(null);
  };

  const submit = () => {
    if (disabled) return;
    const mappingAnswers = items.map((item, index) => {
      const leftKey = `left-${index}`;
      const rightKey = `right-${index}`;
      return {
        flashCardId: item.flashCardId,
        isCorrect: pairs[leftKey] === rightKey
      };
    });
    const isCorrect = mappingAnswers.every((answer) => answer.isCorrect);

    onAnswer(isCorrect, mappingAnswers);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.questionText}>Match the pairs</Text>
      <View style={styles.mappingColumns}>
        <View style={styles.mappingColumn}>
          {leftItems.map((item) => {
            const selected = item.key === selectedLeftKey;
            const pairedRight = pairs[item.key];
            return (
              <Pressable
                key={item.key}
                onPress={() => setSelectedLeftKey(item.key)}
                style={[
                  styles.mappingItem,
                  selected ? styles.mappingItemSelected : null
                ]}
                disabled={disabled}
              >
                <Text style={styles.mappingLabel}>
                  {getLanguageLabel(item.text.language)}
                </Text>
                <Text style={styles.mappingText}>{item.text.value}</Text>
                {pairedRight ? (
                  <Text style={styles.mappingHint}>Paired</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.mappingColumn}>
          {rightItems.map((item) => {
            const isTaken = Object.values(pairs).includes(item.key);
            return (
              <Pressable
                key={item.key}
                onPress={() => assignPair(item.key)}
                style={[
                  styles.mappingItem,
                  isTaken ? styles.mappingItemDisabled : null
                ]}
                disabled={disabled || isTaken || !selectedLeftKey}
              >
                <Text style={styles.mappingLabel}>
                  {getLanguageLabel(item.text.language)}
                </Text>
                <Text style={styles.mappingText}>{item.text.value}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Button label="Submit" onClick={submit} />
    </View>
  );
}

function normalizeFreeTextAnswer(value: string): string {
  const lower = value.trim().toLowerCase();

  // When enabled, ignore Arabic vocalization marks for FreeText answers.
  if (!IGNORE_VOCALIZATION) return lower;

  return stripArabicDiacritics(lower);
}

function stripArabicDiacritics(value: string): string {
  // Normalize to FormD to separate combining marks before stripping.
  const normalized = value.normalize("NFD");

  // Arabic diacritics and related marks to ignore for matching.
  // Tanwin Fath (U+064B)
  // Tanwin Damm (U+064C)
  // Tanwin Kasr (U+064D)
  // Fatha (U+064E)
  // Damma (U+064F)
  // Kasra (U+0650)
  // Shadda (U+0651)
  // Sukun (U+0652)
  // Superscript Alif (U+0670)
  // Tatweel (U+0640)
  // Quranic/extended marks (U+06D6–U+06ED)
  return normalized.replace(/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED]/g, "");
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getLanguageLabel(language: LearningLanguage): string {
  switch (language) {
    case LearningLanguage.Foreign:
      return "Foreign";
    case LearningLanguage.Local:
      return "Local";
    default:
      return "Unknown";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  status: {
    color: "#93C5FD"
  },
  sessionHeader: {
    gap: 8
  },
  progressTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: "#22C55E"
  },
  progressRemaining: {
    backgroundColor: "rgba(148, 163, 184, 0.3)"
  },
  abortButton: {
    alignSelf: "flex-end"
  },
  abortText: {
    color: "#93C5FD",
    fontSize: 13
  },
  sessionMeta: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metaText: {
    color: "#94A3B8"
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  questionLabel: {
    color: "#94A3B8",
    fontSize: 12,
    textTransform: "uppercase"
  },
  questionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600"
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF"
  },
  optionList: {
    gap: 10
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)"
  },
  optionRowSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.15)"
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#94A3B8"
  },
  radioSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "#38BDF8"
  },
  optionText: {
    color: "#E2E8F0",
    fontSize: 15
  },
  mappingColumns: {
    flexDirection: "row",
    gap: 12
  },
  mappingColumn: {
    flex: 1,
    gap: 10
  },
  mappingItem: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    gap: 4
  },
  mappingItemSelected: {
    borderColor: "#F59E0B"
  },
  mappingItemDisabled: {
    opacity: 0.5
  },
  mappingLabel: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase"
  },
  mappingText: {
    color: "#FFFFFF",
    fontSize: 14
  },
  mappingHint: {
    color: "#38BDF8",
    fontSize: 12
  },
  feedback: {
    fontSize: 15,
    fontWeight: "600"
  },
  correct: {
    color: "#22C55E"
  },
  incorrect: {
    color: "#F97316"
  },
  resultCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 16,
    gap: 8
  },
  resultItem: {
    color: "#E2E8F0",
    fontSize: 15
  }
});
