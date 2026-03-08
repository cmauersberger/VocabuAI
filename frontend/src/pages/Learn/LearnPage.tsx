import React from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";
import Button from "../../components/Button";
import OptionMenuButton from "../../components/OptionMenuButton";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import { LanguageLevel } from "../../domain/LanguageLevel";
import { GrammarConceptId } from "../../domain/GrammarConceptId";
import { TextStyle } from "../../domain/TextStyle";
import type { GenerateTextRequestDto } from "../../domain/dtos/GenerateTextRequestDto";
import type { GenerateTextResponseDto } from "../../domain/dtos/GenerateTextResponseDto";
import type { GeneratedLearningTextDto } from "../../domain/dtos/GeneratedLearningTextDto";
import type { UserSettingsDto } from "../../domain/dtos/UserSettingsDto";
import type { AiProvider } from "../../domain/AiProvider";
import type { LearningSession } from "../../domain/LearningSession";
import type { LearningTask } from "../../domain/LearningTask";
import { LearningTaskType } from "../../domain/LearningTaskType";
import LearnTaskRenderer from "./LearnTaskRenderer";
import {
  getFlashCardIds,
  getGenerationLanguageFromCode,
  handleSseBuffer,
  parseSseEvent,
  removeLastTaskByGuid,
  type SseEvent
} from "./learnUtils";
import styles from "./styles";
import type { MappingAnswerResult, SessionSummary } from "./types";

type Props = {
  authToken: string;
  onAuthFailure?: () => void;
  onSessionActiveChange?: (active: boolean) => void;
  onExitToOverview?: () => void;
};

const DEFAULT_TASK_COUNT = 6;

const isAuthFailureResponse = (response: Response) =>
  response.status === 401 || response.status === 403;

export default function LearnPage({
  authToken,
  onAuthFailure,
  onSessionActiveChange,
  onExitToOverview
}: Props) {
  const apiBaseUrl = getApiBaseUrl();
  const handleAuthFailure = React.useCallback(() => {
    if (!onAuthFailure) return false;
    onAuthFailure();
    return true;
  }, [onAuthFailure]);

  const [session, setSession] = React.useState<LearningSession | null>(null);
  const [tasks, setTasks] = React.useState<LearningTask[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [completedGuids, setCompletedGuids] = React.useState<Set<string>>(
    () => new Set()
  );
  const [status, setStatus] = React.useState<string | null>(null);
  const [userSettings, setUserSettings] = React.useState<UserSettingsDto | null>(
    null
  );
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(false);
  const [generatedText, setGeneratedText] = React.useState<string | null>(null);
  const [generationError, setGenerationError] = React.useState<string | null>(
    null
  );
  const [generationStatus, setGenerationStatus] = React.useState<string | null>(
    null
  );
  const [isGeneratingText, setIsGeneratingText] = React.useState(false);
  const [isGenerateProviderMenuOpen, setIsGenerateProviderMenuOpen] =
    React.useState(false);
  const [openAiUsage, setOpenAiUsage] = React.useState<{
    tokenUsage: GenerateTextResponseDto["tokenUsage"] | null;
    usagePercent: number | null;
  } | null>(null);
  const [isHistoryOverlayOpen, setIsHistoryOverlayOpen] = React.useState(false);
  const [generatedTextHistory, setGeneratedTextHistory] = React.useState<
    GeneratedLearningTextDto[]
  >([]);
  const [expandedPromptIds, setExpandedPromptIds] = React.useState<Set<number>>(
    () => new Set()
  );
  const [historyStatus, setHistoryStatus] = React.useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [deletingHistoryId, setDeletingHistoryId] = React.useState<number | null>(
    null
  );
  const stopStreamingRef = React.useRef(false);
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [summary, setSummary] = React.useState<SessionSummary | null>(null);
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
        const responses = await Promise.all(
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
        if (responses.some(isAuthFailureResponse)) {
          handleAuthFailure();
        }
      } catch {
        handleAuthFailure();
      }
    },
    [apiBaseUrl, authToken, handleAuthFailure]
  );

  const loadUserSettings = React.useCallback(async () => {
    setIsLoadingSettings(true);
    try {
      const response = await fetch(`${apiBaseUrl}/users/settings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as UserSettingsDto;
      setUserSettings(payload);
    } catch {
      handleAuthFailure();
    } finally {
      setIsLoadingSettings(false);
    }
  }, [apiBaseUrl, authToken, handleAuthFailure]);

  React.useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

  const loadGeneratedTextHistory = React.useCallback(async () => {
    setIsLoadingHistory(true);
    setHistoryStatus("Loading generated text history...");
    try {
      const response = await fetch(
        `${apiBaseUrl}/learning-session/generated-text-history/list`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
      if (!response.ok) {
        setHistoryStatus("Unable to load generated text history.");
        return;
      }

      const payload = (await response.json()) as GeneratedLearningTextDto[];
      setGeneratedTextHistory(payload);
      setExpandedPromptIds((prev) => {
        const next = new Set<number>();
        const availableIds = new Set(payload.map((item) => item.id));
        prev.forEach((id) => {
          if (availableIds.has(id)) {
            next.add(id);
          }
        });
        return next;
      });
      setHistoryStatus(
        payload.length === 0 ? "No generated text has been saved yet." : null
      );
    } catch {
      if (handleAuthFailure()) return;
      setHistoryStatus("Unable to reach the API.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [apiBaseUrl, authToken, handleAuthFailure]);

  React.useEffect(() => {
    if (!isHistoryOverlayOpen) return;
    void loadGeneratedTextHistory();
  }, [isHistoryOverlayOpen, loadGeneratedTextHistory]);

  const confirmDeleteGeneratedText = React.useCallback(async () => {
    const confirmationMessage =
      "This action is irreversible. Do you really want to delete this generated text?";

    if (Platform.OS === "web") {
      if (typeof window === "undefined" || typeof window.confirm !== "function") {
        return false;
      }
      return window.confirm(confirmationMessage);
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert("Delete generated text?", confirmationMessage, [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false)
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => resolve(true)
        }
      ]);
    });
  }, []);

  const deleteGeneratedText = React.useCallback(
    async (item: GeneratedLearningTextDto) => {
      const shouldDelete = await confirmDeleteGeneratedText();
      if (!shouldDelete) return;

      setDeletingHistoryId(item.id);
      try {
        const response = await fetch(
          `${apiBaseUrl}/learning-session/generated-text-history/delete/${item.id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );

        if (isAuthFailureResponse(response)) {
          if (handleAuthFailure()) return;
        }
        if (!response.ok && response.status !== 404) {
          setHistoryStatus("Unable to delete generated text.");
          return;
        }

        const nextItems = generatedTextHistory.filter(
          (historyItem) => historyItem.id !== item.id
        );
        setGeneratedTextHistory(nextItems);
        setExpandedPromptIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setHistoryStatus(
          nextItems.length === 0 ? "No generated text has been saved yet." : null
        );
      } catch {
        if (handleAuthFailure()) return;
        setHistoryStatus("Unable to reach the API.");
      } finally {
        setDeletingHistoryId(null);
      }
    },
    [
      apiBaseUrl,
      authToken,
      confirmDeleteGeneratedText,
      generatedTextHistory,
      handleAuthFailure
    ]
  );

  const formatHistoryTimestamp = React.useCallback((isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) {
      return isoDate;
    }
    return parsed.toLocaleString();
  }, []);

  const formatHistoryEngineLabel = React.useCallback((provider: string) => {
    const normalized = provider.trim().toLowerCase();
    if (normalized === "openai") {
      return "OpenAI (Paid)";
    }
    if (normalized === "ollama") {
      return "Local (Open)";
    }
    return provider;
  }, []);

  const togglePromptExpanded = React.useCallback((id: number) => {
    setExpandedPromptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const currentTask =
    session && currentIndex < tasks.length ? tasks[currentIndex] : null;

  const totalSteps = tasks.length;
  const answeredSteps = Math.min(totalAnswers, totalSteps);
  const progress = totalSteps === 0 ? 0 : answeredSteps / totalSteps;
  const isOpenAiConfigured = Boolean(
    userSettings?.hasOpenAiKey && userSettings.openAiMonthlyTokenLimit > 0
  );

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

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
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
      if (handleAuthFailure()) return;
      setStatus("Unable to reach the API.");
    }
  };

  const generateText = async (provider: AiProvider) => {
    setIsGenerateProviderMenuOpen(false);
    setGenerationStatus("Generating text...");
    setGenerationError(null);
    setGeneratedText(null);
    setIsGeneratingText(true);
    stopStreamingRef.current = false;
    setOpenAiUsage(null);

    if (!userSettings) {
      setGenerationStatus(null);
      setGenerationError("User settings are missing.");
      setIsGeneratingText(false);
      return;
    }

    const targetLanguage = getGenerationLanguageFromCode(
      userSettings?.defaultForeignFlashCardLanguage
    );
    if (!targetLanguage) {
      setGenerationStatus(null);
      setGenerationError("Unsupported target language.");
      setIsGeneratingText(false);
      return;
    }

    if (provider === "openai" && !isOpenAiConfigured) {
      setGenerationStatus(null);
      setGenerationError(
        "OpenAI is not configured. Set a key and monthly limit in Settings."
      );
      setIsGeneratingText(false);
      return;
    }

    const request: GenerateTextRequestDto = {
      targetLanguage,
      minWordCount: 50,
      maxWordCount: 80,
      allowedGrammar: [
        GrammarConceptId.ArabicFullyVocalized,
        GrammarConceptId.PresentTense,
        GrammarConceptId.Negation,
        GrammarConceptId.Pronouns
      ],
      forbiddenGrammar: [
        GrammarConceptId.PastTense,
        GrammarConceptId.FutureTense,
        GrammarConceptId.Conditional,
        GrammarConceptId.RelativeClauses
      ],
      style: TextStyle.Unspecified,
      languageLevel: LanguageLevel.A1,
      provider
    };

    if (provider === "openai") {
      await generateTextNonStreaming(request);
      return;
    }

    if (Platform.OS === "web") {
      await streamTextOnWeb(request);
      return;
    }

    await streamTextOnNative(request);
  };

  const handleSseEvent = React.useCallback(
    (event: SseEvent) => {
      if (event.event === "error") {
        stopStreamingRef.current = true;
        setGenerationError(event.data || "Text generation failed.");
        return;
      }

      if (event.event === "done") {
        stopStreamingRef.current = true;
        return;
      }

      if (event.data) {
        setGeneratedText((prev) => `${prev ?? ""}${event.data}`);
      }
    },
    []
  );

  const streamTextOnWeb = async (request: GenerateTextRequestDto) => {
    try {
      const response = await fetch(
        `${apiBaseUrl}/learning-session/generate-text-stream`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(request)
        }
      );

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
      if (!response.ok || !response.body) {
        setGenerationError("Unable to generate text.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        buffer = handleSseBuffer(buffer, handleSseEvent);
        if (stopStreamingRef.current) break;
      }

      if (buffer.trim()) {
        handleSseEvent(parseSseEvent(buffer));
      }
    } catch (error) {
      if (handleAuthFailure()) return;
      setGenerationError("Unable to reach the API.");
    } finally {
      setGenerationStatus(null);
      setIsGeneratingText(false);
    }
  };

  const streamTextOnNative = async (request: GenerateTextRequestDto) => {
    try {
      const { default: EventSource } = await import("react-native-sse");
      const source = new EventSource(
        `${apiBaseUrl}/learning-session/generate-text-stream`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(request)
        }
      );

      const closeStream = () => {
        source.close();
        setGenerationStatus(null);
        setIsGeneratingText(false);
      };

      source.addEventListener("message", (event: { data?: string }) => {
        if (typeof event.data === "string") {
          setGeneratedText((prev) => `${prev ?? ""}${event.data}`);
        }
      });

      source.addEventListener("error", (event: { data?: string }) => {
        if (typeof event.data === "string" && event.data.trim()) {
          setGenerationError(event.data);
        } else {
          setGenerationError("Unable to generate text.");
        }
        closeStream();
      });

      source.addEventListener("done", () => {
        closeStream();
      });
    } catch (error) {
      if (handleAuthFailure()) return;
      setGenerationError("Unable to reach the API.");
      setGenerationStatus(null);
      setIsGeneratingText(false);
    }
  };

  const generateTextNonStreaming = async (request: GenerateTextRequestDto) => {
    try {
      const response = await fetch(`${apiBaseUrl}/learning-session/generate-text`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as
          | { code?: string; message?: string }
          | null;
        if (errorPayload?.code === "OPENAI_TOKEN_BUDGET_EXCEEDED") {
          setGenerationError("OpenAI token budget exceeded for this month.");
        } else {
          setGenerationError(errorPayload?.message || "Unable to generate text.");
        }
        return;
      }

      const payload = (await response.json()) as GenerateTextResponseDto;
      if (!payload.isValid) {
        setGenerationError(payload.errorMessage || "Text generation failed.");
      } else {
        setGeneratedText(payload.text);
      }

      if (payload.provider === "openai") {
        setOpenAiUsage({
          tokenUsage: payload.tokenUsage,
          usagePercent: payload.usagePercent
        });
      }
    } catch {
      if (handleAuthFailure()) return;
      setGenerationError("Unable to reach the API.");
    } finally {
      setGenerationStatus(null);
      setIsGeneratingText(false);
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
        {status ? <Text style={styles.status}>{status}</Text> : null}
        <Button
          label="Start learning"
          onClick={startSession}
          style={styles.centeredButton}
        />
        <View style={styles.generationActionsSection}>
          <Text style={styles.generationActionsTitle}>Text generation</Text>
          {isGenerateProviderMenuOpen ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsGenerateProviderMenuOpen(false)}
              style={styles.providerMenuBackdrop}
            />
          ) : null}
          {!isOpenAiConfigured ? (
            <Text style={styles.providerWarning}>
              OpenAI option is unavailable until configured in Settings.
            </Text>
          ) : null}
          <View style={styles.generationButtonsGroup}>
            <Button
              label="Generated Text History"
              onClick={() => setIsHistoryOverlayOpen(true)}
              style={styles.historySecondaryButton}
              disabled={isLoadingHistory}
            />
            <OptionMenuButton<AiProvider>
              label="Generate Text"
              isOpen={isGenerateProviderMenuOpen}
              onToggle={() => setIsGenerateProviderMenuOpen((prev) => !prev)}
              onClose={() => setIsGenerateProviderMenuOpen(false)}
              onSelect={(provider) => {
                void generateText(provider);
              }}
              options={[
                { value: "ollama", label: "Local (Ollama)" },
                {
                  value: "openai",
                  label: "OpenAI (Paid)",
                  disabled: !isOpenAiConfigured
                }
              ]}
              containerStyle={styles.generateProviderMenu}
              disabled={isGeneratingText || isLoadingSettings}
            />
          </View>
        </View>
        {generationStatus ? (
          <Text style={styles.status}>{generationStatus}</Text>
        ) : null}
        {generationError ? (
          <Text style={styles.generationError}>{generationError}</Text>
        ) : null}
        {generatedText ? (
          <View style={styles.generatedTextCard}>
            <Text style={styles.generatedText}>{generatedText}</Text>
          </View>
        ) : null}
        {openAiUsage ? (
          <Text style={styles.openAiUsageText}>
            OpenAI usage this call: {openAiUsage.tokenUsage?.totalTokens ?? 0}{" "}
            tokens. Monthly usage:{" "}
            {openAiUsage.usagePercent !== null
              ? `${Math.round(openAiUsage.usagePercent * 100)}%`
              : "n/a"}
            .
          </Text>
        ) : null}
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
        {isHistoryOverlayOpen ? (
          <View style={styles.historyOverlay} pointerEvents="box-none">
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsHistoryOverlayOpen(false)}
              style={styles.historyBackdrop}
            />
            <View style={styles.historyPanel}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Generated Text History</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsHistoryOverlayOpen(false)}
                  style={styles.historyCloseButton}
                >
                  <Text style={styles.historyCloseButtonText}>Close</Text>
                </Pressable>
              </View>
              {historyStatus ? (
                <Text style={styles.historyStatus}>{historyStatus}</Text>
              ) : null}
              <ScrollView contentContainerStyle={styles.historyListContent}>
                {generatedTextHistory.map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <Text style={styles.historyItemMeta}>
                      {formatHistoryTimestamp(item.dateTimeCreated)} |{" "}
                      Engine: {formatHistoryEngineLabel(item.provider)}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => togglePromptExpanded(item.id)}
                      style={({ pressed }) => [
                        styles.historyPromptToggleRow,
                        pressed ? styles.historyPromptToggleRowPressed : null
                      ]}
                    >
                      <Text style={styles.historyLabel}>Prompt</Text>
                      <Text style={styles.historyPromptToggleText}>
                        {expandedPromptIds.has(item.id) ? "Hide" : "Show"}
                      </Text>
                    </Pressable>
                    {expandedPromptIds.has(item.id) ? (
                      <Text style={styles.historyPrompt}>{item.prompt}</Text>
                    ) : null}
                    <Text style={styles.historyLabel}>Text</Text>
                    <Text style={styles.historyText}>{item.text}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => {
                        void deleteGeneratedText(item);
                      }}
                      disabled={deletingHistoryId === item.id}
                      style={({ pressed }) => [
                        styles.historyDeleteButton,
                        pressed ? styles.historyDeleteButtonPressed : null,
                        deletingHistoryId === item.id
                          ? styles.historyDeleteButtonDisabled
                          : null
                      ]}
                    >
                      <Text style={styles.historyDeleteText}>
                        {deletingHistoryId === item.id ? "Deleting..." : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>
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
        <LearnTaskRenderer
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
