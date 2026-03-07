import React from "react";
import { Text, TextInput, View } from "react-native";
import type { FreeTextTaskPayload } from "../../domain/FreeTextTaskPayload";
import Button from "../../components/Button";
import LearnCorrectionActions from "./LearnCorrectionActions";
import { getLanguageLabel, normalizeFreeTextAnswer } from "./learnUtils";
import styles from "./styles";

type Props = {
  payload: FreeTextTaskPayload;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnFreeTextTask({
  payload,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: Props) {
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
