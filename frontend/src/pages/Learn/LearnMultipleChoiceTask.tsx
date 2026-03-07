import React from "react";
import { Pressable, Text, View } from "react-native";
import type { MultipleChoiceTaskPayload } from "../../domain/MultipleChoiceTaskPayload";
import { LearningSelectionMode } from "../../domain/LearningSelectionMode";
import Button from "../../components/Button";
import LearnCorrectionActions from "./LearnCorrectionActions";
import { getLanguageLabel } from "./learnUtils";
import styles from "./styles";

type Props = {
  payload: MultipleChoiceTaskPayload;
  onAnswer: (isCorrect: boolean) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnMultipleChoiceTask({
  payload,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: Props) {
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
          <LearnCorrectionActions onContinue={onContinue} onCheat={onCheat} />
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
