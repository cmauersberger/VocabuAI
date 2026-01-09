import React from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
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

const DEFAULT_TASK_COUNT = 6;
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
  const [boxCounts, setBoxCounts] = React.useState<Record<string, number> | null>(
    null
  );
  const [totalAnswers, setTotalAnswers] = React.useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = React.useState(0);
  const [feedback, setFeedback] = React.useState<null | {
    correct: boolean;
    message: string;
  }>(null);
  const [isAdvancing, setIsAdvancing] = React.useState(false);
  const [correctionGuid, setCorrectionGuid] = React.useState<string | null>(null);
  const [pendingAnswer, setPendingAnswer] = React.useState<{
    task: LearningTask;
    mappingAnswers?: MappingAnswerResult[];
  } | null>(null);
  const [flashTone, setFlashTone] = React.useState<"correct" | "incorrect" | null>(
    null
  );
  const flashOpacity = React.useRef(new Animated.Value(0)).current;
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
            fetch(`${apiBaseUrl}/learning-session/flashcard-answered`, {
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

  const loadBoxCounts = React.useCallback(async () => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/flashcards/count-per-box`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      );

      if (!response.ok) return;
      const payload = (await response.json()) as Record<string, number>;
      setBoxCounts(payload);
    } catch {
      // Ignore box count errors to avoid blocking the learning screen.
    }
  }, [apiBaseUrl, authToken]);

  React.useEffect(() => {
    if (!session) {
      void loadBoxCounts();
    }
  }, [loadBoxCounts, session]);

  const currentTask =
    session && currentIndex < tasks.length ? tasks[currentIndex] : null;

  const totalSteps = tasks.length;
  const answeredSteps = Math.min(totalAnswers, totalSteps);
  const progress = totalSteps === 0 ? 0 : answeredSteps / totalSteps;

  const resetSessionState = React.useCallback(() => {
    setSession(null);
    setTasks([]);
    setCurrentIndex(0);
    setCompletedGuids(new Set());
    setStartedAt(null);
    setFeedback(null);
    setIsAdvancing(false);
    setCorrectionGuid(null);
    setPendingAnswer(null);
    setFlashTone(null);
    flashOpacity.stopAnimation();
    flashOpacity.setValue(0);
  }, []);

  const startSession = async () => {
    setStatus("Starting session...");
    setSummary(null);
    setTotalAnswers(0);
    setIncorrectAnswers(0);

    try {
      const response = await fetch(`${apiBaseUrl}/learning-session/create`, {
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

  const recordAnswer = React.useCallback(
    (isCorrect: boolean, mappingAnswers?: MappingAnswerResult[]) => {
      if (!currentTask) return;

      if (isCorrect) {
        void sendFlashcardAnswer(currentTask, true, mappingAnswers);
        setPendingAnswer(null);
      } else {
        setPendingAnswer({ task: currentTask, mappingAnswers });
      }
      setFlashTone(isCorrect ? "correct" : "incorrect");
      flashOpacity.stopAnimation();
      flashOpacity.setValue(0.18);
      Animated.timing(flashOpacity, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true
      }).start(() => {
        setFlashTone(null);
      });

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

      if (isCorrect) {
        setFeedback({
          correct: true,
          message: "Correct."
        });
        setIsAdvancing(true);

        setTimeout(() => {
          setFeedback(null);
          setIsAdvancing(false);
          setCurrentIndex((prev) => prev + 1);
        }, 700);
      } else {
        setFeedback(null);
        setCorrectionGuid(currentTask.guid);
        setIsAdvancing(true);
      }
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
  };

  const continueAfterCorrection = () => {
    if (pendingAnswer) {
      void sendFlashcardAnswer(pendingAnswer.task, false, pendingAnswer.mappingAnswers);
      setPendingAnswer(null);
    }
    setFeedback(null);
    setIsAdvancing(false);
    setCorrectionGuid(null);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleCheat = () => {
    if (!pendingAnswer) return;
    const guid = pendingAnswer.task.guid;
    const nextTasks = removeLastTaskByGuid(tasks, guid);
    const nextCompletedGuids = new Set(completedGuids);
    nextCompletedGuids.add(guid);
    const nextIncorrectAnswers = Math.max(0, incorrectAnswers - 1);

    void sendFlashcardAnswer(pendingAnswer.task, true);
    setPendingAnswer(null);
    setTasks(nextTasks);
    setCompletedGuids(nextCompletedGuids);
    setIncorrectAnswers(nextIncorrectAnswers);

    const completedTaskCount = nextTasks.filter((task) =>
      nextCompletedGuids.has(task.guid)
    ).length;

    if (completedTaskCount >= nextTasks.length) {
      const finishedAt = Date.now();
      setSummary({
        taskCount: completedTaskCount,
        incorrectAnswers: nextIncorrectAnswers,
        totalAnswers,
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

    setFeedback(null);
    setIsAdvancing(false);
    setCorrectionGuid(null);
    setCurrentIndex((prev) => prev + 1);
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Learning</Text>
        {boxCounts ? <BoxOverview counts={boxCounts} /> : null}
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <Button
          label="Start learning"
          onClick={startSession}
          style={styles.centeredButton}
        />
        {summary ? (
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
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {flashTone ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            flashTone === "correct" ? styles.flashCorrect : styles.flashIncorrect,
            { opacity: flashOpacity }
          ]}
        />
      ) : null}
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
          Progress: {answeredSteps}/{totalSteps}
        </Text>
        <Text style={styles.metaText}>Incorrect: {incorrectAnswers}</Text>
      </View>

      {currentTask ? (
        <TaskRenderer
          key={currentTask.guid}
          task={currentTask}
          onAnswer={recordAnswer}
          disabled={isAdvancing}
          showCorrectAnswer={correctionGuid === currentTask.guid}
          onContinue={continueAfterCorrection}
          onCheat={handleCheat}
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
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

function TaskRenderer({
  task,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: TaskRendererProps) {
  switch (task.taskType) {
    case LearningTaskType.FreeText:
      return (
        <FreeTextTask
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
        <MultipleChoiceTask
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
        <MappingTask
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

type BoxOverviewProps = {
  counts: Record<string, number>;
};

function BoxOverview({ counts }: BoxOverviewProps) {
  const entries = Object.entries(counts).sort(
    ([left], [right]) => Number(left) - Number(right)
  );
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <View style={styles.boxOverviewCard}>
      <View style={styles.boxOverviewRow}>
        {entries.map(([box, count]) => (
          <View key={box} style={styles.boxOverviewItem}>
            <Text style={styles.boxOverviewBox}>Box {box}</Text>
            <Text style={styles.boxOverviewCount}>{count}</Text>
          </View>
        ))}
        <View style={styles.boxOverviewSeparator} />
        <View style={styles.boxOverviewItem}>
          <Text style={styles.boxOverviewBox}>Total</Text>
          <Text style={styles.boxOverviewCount}>{total}</Text>
        </View>
      </View>
    </View>
  );
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
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

function FreeTextTask({
  payload,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: FreeTextTaskProps) {
  const [value, setValue] = React.useState("");

  const checkAnswer = () => {
    if (disabled || showCorrectAnswer) return;
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

  const correctAnswers = React.useMemo(() => {
    const answers = payload.answers
      .filter((answer) => answer.correct)
      .map((answer) => answer.value.trim())
      .filter(Boolean);
    return Array.from(new Set(answers));
  }, [payload.answers]);

  return (
    <View style={styles.card}>
      <Text style={styles.questionLabel}>
        {getLanguageLabel(payload.question.language)}
      </Text>
      <Text style={styles.questionTextCentered}>
        {payload.question.value}
      </Text>
      {showCorrectAnswer ? (
        <View style={styles.correctAnswerBlock}>
          <Text style={styles.incorrectLabel}>Incorrect</Text>
          <Text style={styles.correctAnswerText}>
            {correctAnswers.join(" / ")}
          </Text>
          <CorrectionActions onContinue={onContinue} onCheat={onCheat} />
        </View>
      ) : (
        <>
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
          <Button
            label="Submit"
            onClick={checkAnswer}
            style={styles.centeredButton}
          />
        </>
      )}
    </View>
  );
}

type MultipleChoiceTaskProps = {
  payload: MultipleChoiceTaskPayload;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

function MultipleChoiceTask({
  payload,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: MultipleChoiceTaskProps) {
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  const submit = () => {
    if (disabled || showCorrectAnswer) return;
    if (selectedIndex === null) return;
    const selected = payload.options[selectedIndex];
    onAnswer(Boolean(selected?.correct));
  };

  const correctOptions = React.useMemo(() => {
    const options = payload.options
      .filter((option) => option.correct)
      .map((option) => option.value.trim())
      .filter(Boolean);
    return Array.from(new Set(options));
  }, [payload.options]);

  return (
    <View style={styles.card}>
      <Text style={styles.questionLabel}>
        {getLanguageLabel(payload.question.language)}
      </Text>
      <Text style={styles.questionText}>{payload.question.value}</Text>
      {showCorrectAnswer ? (
        <View style={styles.correctAnswerBlock}>
          <Text style={styles.incorrectLabel}>Incorrect</Text>
          <Text style={styles.correctAnswerText}>
            {correctOptions.join(" / ")}
          </Text>
          <CorrectionActions onContinue={onContinue} onCheat={onCheat} />
        </View>
      ) : (
        <>
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
          <Button label="Submit" onClick={submit} style={styles.centeredButton} />
        </>
      )}
    </View>
  );
}

type MappingTaskProps = {
  items: LearningMappingItem[];
  onAnswer: (isCorrect: boolean, mappingAnswers: MappingAnswerResult[]) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

function MappingTask({
  items,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: MappingTaskProps) {
  const [selectedLeftKey, setSelectedLeftKey] = React.useState<string | null>(
    null
  );
  const [selectedRightKey, setSelectedRightKey] = React.useState<string | null>(
    null
  );
  const [pairs, setPairs] = React.useState<
    { leftKey: string; rightKey: string }[]
  >([]);
  const [leftItems, setLeftItems] = React.useState<
    { key: string; text: LearningMappingItem["left"] }[]
  >([]);
  const [rightItems, setRightItems] = React.useState<
    { key: string; text: LearningMappingItem["right"] }[]
  >([]);

  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    if (!UIManager.setLayoutAnimationEnabledExperimental) return;
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }, []);

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
    setPairs([]);
    setSelectedLeftKey(null);
    setSelectedRightKey(null);
  }, [items]);

  const pairsByLeftKey = React.useMemo(() => {
    const map: Record<string, string> = {};
    pairs.forEach((pair) => {
      map[pair.leftKey] = pair.rightKey;
    });
    return map;
  }, [pairs]);

  const pairedLeftKeys = React.useMemo(
    () => new Set(pairs.map((pair) => pair.leftKey)),
    [pairs]
  );

  const pairedRightKeys = React.useMemo(
    () => new Set(pairs.map((pair) => pair.rightKey)),
    [pairs]
  );

  const leftByKey = React.useMemo(() => {
    const map: Record<string, LearningMappingItem["left"]> = {};
    leftItems.forEach((item) => {
      map[item.key] = item.text;
    });
    return map;
  }, [leftItems]);

  const rightByKey = React.useMemo(() => {
    const map: Record<string, LearningMappingItem["right"]> = {};
    rightItems.forEach((item) => {
      map[item.key] = item.text;
    });
    return map;
  }, [rightItems]);

  const unpairedLeftItems = React.useMemo(
    () => leftItems.filter((item) => !pairedLeftKeys.has(item.key)),
    [leftItems, pairedLeftKeys]
  );

  const unpairedRightItems = React.useMemo(
    () => rightItems.filter((item) => !pairedRightKeys.has(item.key)),
    [rightItems, pairedRightKeys]
  );

  const configurePairAnimation = React.useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  const addPair = React.useCallback(
    (leftKey: string, rightKey: string) => {
      if (showCorrectAnswer) return;
      if (pairedLeftKeys.has(leftKey) || pairedRightKeys.has(rightKey)) return;
      configurePairAnimation();
      setPairs((prev) => [...prev, { leftKey, rightKey }]);
      setSelectedLeftKey(null);
      setSelectedRightKey(null);
    },
    [
      configurePairAnimation,
      pairedLeftKeys,
      pairedRightKeys,
      showCorrectAnswer
    ]
  );

  const handleLeftPress = (leftKey: string) => {
    if (disabled || showCorrectAnswer) return;
    if (pairedLeftKeys.has(leftKey)) return;
    if (selectedLeftKey === leftKey) {
      setSelectedLeftKey(null);
      return;
    }
    if (selectedRightKey && !pairedRightKeys.has(selectedRightKey)) {
      addPair(leftKey, selectedRightKey);
      return;
    }
    setSelectedLeftKey(leftKey);
  };

  const handleRightPress = (rightKey: string) => {
    if (disabled || showCorrectAnswer) return;
    if (pairedRightKeys.has(rightKey)) return;
    if (selectedRightKey === rightKey) {
      setSelectedRightKey(null);
      return;
    }
    if (selectedLeftKey && !pairedLeftKeys.has(selectedLeftKey)) {
      addPair(selectedLeftKey, rightKey);
      return;
    }
    setSelectedRightKey(rightKey);
  };

  const unpair = (leftKey: string, rightKey: string) => {
    if (disabled || showCorrectAnswer) return;
    configurePairAnimation();
    setPairs((prev) =>
      prev.filter((pair) => !(pair.leftKey === leftKey && pair.rightKey === rightKey))
    );
    if (selectedLeftKey === leftKey) {
      setSelectedLeftKey(null);
    }
    if (selectedRightKey === rightKey) {
      setSelectedRightKey(null);
    }
  };

  const submit = () => {
    if (disabled || showCorrectAnswer) return;
    const mappingAnswers = items.map((item, index) => {
      const leftKey = `left-${index}`;
      const rightKey = `right-${index}`;
      return {
        flashCardId: item.flashCardId,
        isCorrect: pairsByLeftKey[leftKey] === rightKey
      };
    });
    const isCorrect = mappingAnswers.every((answer) => answer.isCorrect);

    onAnswer(isCorrect, mappingAnswers);
  };

  const allPaired = pairs.length === items.length;

  return (
    <View style={[styles.card, styles.mappingCard]}>
      <Text style={styles.questionText}>Match the pairs</Text>
      {showCorrectAnswer ? (
        <View style={styles.correctAnswerBlock}>
          <Text style={styles.incorrectLabel}>Incorrect</Text>
          <View style={styles.mappingCorrectList}>
            {items.map((item, index) => (
              <View key={`correct-${index}`} style={styles.mappingCorrectRow}>
                <View style={[styles.mappingItem, styles.mappingCorrectItem]}>
                  <Text style={styles.mappingText}>{item.left.value}</Text>
                </View>
                <View style={styles.mappingCorrectLine} />
                <View style={[styles.mappingItem, styles.mappingCorrectItem]}>
                  <Text style={styles.mappingText}>{item.right.value}</Text>
                </View>
              </View>
            ))}
          </View>
          <CorrectionActions onContinue={onContinue} onCheat={onCheat} />
        </View>
      ) : (
        <>
          <View style={styles.mappingSection}>
            <Text style={styles.mappingSectionLabel}>Unpaired</Text>
            <View style={styles.mappingColumns}>
              <View style={styles.mappingColumn}>
                {unpairedLeftItems.map((item) => {
                  const selected = item.key === selectedLeftKey;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => handleLeftPress(item.key)}
                      style={[
                        styles.mappingItem,
                        selected ? styles.mappingItemSelected : null
                      ]}
                      disabled={disabled}
                    >
                      <Text style={styles.mappingText}>{item.text.value}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.mappingColumn}>
                {unpairedRightItems.map((item) => {
                  const selected = item.key === selectedRightKey;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => handleRightPress(item.key)}
                      style={[
                        styles.mappingItem,
                        selected ? styles.mappingItemSelected : null
                      ]}
                      disabled={disabled}
                    >
                      <Text style={styles.mappingText}>{item.text.value}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.mappingSection}>
            <Text style={styles.mappingSectionLabel}>Paired</Text>
            {pairs.length === 0 ? (
              <Text style={styles.mappingEmptyHint}>No pairs yet.</Text>
            ) : (
              <View style={styles.mappingPairedList}>
                {pairs.map((pair) => {
                  const left = leftByKey[pair.leftKey];
                  const right = rightByKey[pair.rightKey];
                  if (!left || !right) return null;
                  return (
                    <View
                      key={`${pair.leftKey}-${pair.rightKey}`}
                      style={styles.mappingPairedRow}
                    >
                      <View style={[styles.mappingItem, styles.mappingPairedItem]}>
                        <Text style={styles.mappingText}>{left.value}</Text>
                      </View>
                      <Pressable
                        onPress={() => unpair(pair.leftKey, pair.rightKey)}
                        style={styles.mappingUnpairButton}
                        disabled={disabled}
                      >
                        <Text style={styles.mappingUnpairText}>Unpair</Text>
                      </Pressable>
                      <View style={[styles.mappingItem, styles.mappingPairedItem]}>
                        <Text style={styles.mappingText}>{right.value}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <Button
            label="Submit"
            onClick={submit}
            style={styles.centeredButton}
            disabled={!allPaired || disabled}
          />
        </>
      )}
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

type CorrectionActionsProps = {
  onContinue: () => void;
  onCheat: () => void;
};

function CorrectionActions({ onContinue, onCheat }: CorrectionActionsProps) {
  return (
    <View style={styles.correctionActions}>
      <Button
        label="Cheat (count as correct)"
        onClick={onCheat}
        style={styles.secondaryButton}
      />
      <Button label="Continue" onClick={onContinue} />
    </View>
  );
}

function removeLastTaskByGuid(tasks: LearningTask[], guid: string): LearningTask[] {
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    position: "relative"
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  status: {
    color: "#93C5FD"
  },
  boxOverviewCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 8,
    gap: 6,
    alignSelf: "center"
  },
  boxOverviewTitle: {
    color: "#94A3B8",
    fontSize: 11,
    textTransform: "uppercase"
  },
  boxOverviewRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "center",
    gap: 4
  },
  boxOverviewItem: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 48
  },
  boxOverviewBox: {
    color: "#93C5FD",
    fontSize: 11
  },
  boxOverviewCount: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600"
  },
  boxOverviewSeparator: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(148, 163, 184, 0.4)",
    alignSelf: "center"
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
  mappingCard: {},
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
  questionTextCentered: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
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
  mappingSection: {
    gap: 8
  },
  mappingSectionLabel: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase"
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
  mappingText: {
    color: "#FFFFFF",
    fontSize: 16
  },
  mappingEmptyHint: {
    color: "#94A3B8",
    fontSize: 13
  },
  mappingPairedList: {
    gap: 10
  },
  mappingPairedRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)"
  },
  mappingPairedItem: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)"
  },
  mappingUnpairButton: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)"
  },
  mappingUnpairText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  mappingActionBar: {
    paddingTop: 4
  },
  incorrectLabel: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  correctAnswerBlock: {
    alignItems: "center",
    gap: 12
  },
  correctAnswerText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  mappingCorrectList: {
    gap: 10,
    width: "100%"
  },
  mappingCorrectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  mappingCorrectItem: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.15)"
  },
  mappingCorrectLine: {
    height: 2,
    backgroundColor: "#22C55E",
    flex: 1,
    alignSelf: "center"
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
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12
  },
  flashCorrect: {
    backgroundColor: "#22C55E"
  },
  flashIncorrect: {
    backgroundColor: "#EF4444"
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
  },
  centeredButton: {
    alignSelf: "center"
  },
  correctionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center"
  },
  secondaryButton: {
    backgroundColor: "#334155"
  }
});
