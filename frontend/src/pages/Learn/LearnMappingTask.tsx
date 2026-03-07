import React from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  Text,
  UIManager,
  View
} from "react-native";
import type { LearningMappingItem } from "../../domain/LearningMappingItem";
import Button from "../../components/Button";
import type { MappingAnswerResult } from "./types";
import LearnCorrectionActions from "./LearnCorrectionActions";
import { shuffle } from "./learnUtils";
import styles from "./styles";

type Props = {
  items: LearningMappingItem[];
  onAnswer: (isCorrect: boolean, mappingAnswers: MappingAnswerResult[]) => void;
  disabled: boolean;
  showCorrectAnswer: boolean;
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnMappingTask({
  items,
  onAnswer,
  disabled,
  showCorrectAnswer,
  onContinue,
  onCheat
}: Props) {
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
          <LearnCorrectionActions onContinue={onContinue} onCheat={onCheat} />
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
