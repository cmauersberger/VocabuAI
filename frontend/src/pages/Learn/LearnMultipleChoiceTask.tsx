import React from "react";
import { Pressable, Text, View } from "react-native";
import PronounceableArabicText from "../../components/PronounceableArabicText";
import type { MultipleChoiceTaskPayload } from "../../domain/MultipleChoiceTaskPayload";
import type { UserSettingsDto } from "../../domain/dtos/UserSettingsDto";
import { LearningSelectionMode } from "../../domain/LearningSelectionMode";
import Button from "../../components/Button";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import LearnCorrectionActions from "./LearnCorrectionActions";
import {
  getLanguageCodeForLearningText,
  getLanguageLabel,
  getOppositeLanguageCodeForLearningText
} from "./learnUtils";
import styles from "./styles";

type Props = {
  authToken: string;
  userSettings: UserSettingsDto | null;
  payload: MultipleChoiceTaskPayload;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnMultipleChoiceTask({
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
  const optionLanguageCode = getOppositeLanguageCodeForLearningText(
    payload.question.language,
    userSettings
  );
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
      <PronounceableArabicText
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        text={payload.question.value}
        languageCode={questionLanguageCode}
        textStyle={styles.questionText}
      />
      {showCorrectAnswer ? (
        <View style={styles.correctAnswerBlock}>
          <Text style={styles.incorrectLabel}>Incorrect</Text>
          {correctOptions.map((option, index) => (
            <PronounceableArabicText
              key={`${option}-${index}`}
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
              text={option}
              languageCode={optionLanguageCode}
              textStyle={styles.correctAnswerText}
            />
          ))}
          <LearnCorrectionActions onContinue={onContinue} onCheat={onCheat} />
        </View>
      ) : (
        <>
          {payload.selectionMode !== LearningSelectionMode.Single ? null : (
            <View style={styles.optionList}>
              {payload.options.map((option, index) => {
                const selected = index === selectedIndex;
                return (
                  <View
                    key={`${option.value}-${index}`}
                    style={styles.optionRowContainer}
                  >
                    <Pressable
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
                    <PronounceableArabicText
                      apiBaseUrl={apiBaseUrl}
                      authToken={authToken}
                      text={option.value}
                      languageCode={optionLanguageCode}
                      textStyle={styles.hiddenArabicText}
                    />
                  </View>
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
