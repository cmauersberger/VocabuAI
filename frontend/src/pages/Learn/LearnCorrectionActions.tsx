import React from "react";
import { View } from "react-native";
import Button from "../../components/Button";
import styles from "./styles";

type Props = {
  onContinue: () => void;
  onCheat: () => void;
};

export default function LearnCorrectionActions({ onContinue, onCheat }: Props) {
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
