import React from "react";
import { Text, TextInput, View } from "react-native";
import PronounceableArabicText from "../../components/PronounceableArabicText";
import type { FreeTextTaskPayload } from "../../domain/FreeTextTaskPayload";
import type { UserSettingsDto } from "../../domain/dtos/UserSettingsDto";
import Button from "../../components/Button";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import LearnCorrectionActions from "./LearnCorrectionActions";
import {
  getLanguageCodeForLearningText,
  getLanguageLabel,
  getOppositeLanguageCodeForLearningText,
  normalizeFreeTextAnswer
} from "./learnUtils";
import styles from "./styles";

type Props = {
  authToken: string;
  userSettings: UserSettingsDto | null;
  payload: FreeTextTaskPayload;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnFreeTextTask({
  authToken,
  userSettings,
  payload,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: Props) {
  const apiBaseUrl = getApiBaseUrl();
  const questionLanguageCode = getLanguageCodeForLearningText(
    payload.question.language,
    userSettings
  );
  const answerLanguageCode = getOppositeLanguageCodeForLearningText(
    payload.question.language,
    userSettings
  );
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
      <PronounceableArabicText
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        text={payload.question.value}
        languageCode={questionLanguageCode}
        textStyle={styles.questionTextCentered}
      />
      {showCorrectAnswer ? (
        <View style={styles.correctAnswerBlock}>
          <Text style={styles.incorrectLabel}>Incorrect</Text>
          {correctAnswers.map((answer, index) => (
            <PronounceableArabicText
              key={`${answer}-${index}`}
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
              text={answer}
              languageCode={answerLanguageCode}
              textStyle={styles.correctAnswerText}
            />
          ))}
          <LearnCorrectionActions onContinue={onContinue} onCheat={onCheat} />
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
