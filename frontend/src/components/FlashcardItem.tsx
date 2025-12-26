import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../domain/dtos/flashcards/FlashCardDto";
import Button from "./Button";

type Props = {
  card: FlashCardDto;
  onEdit?: () => void;
};

export default function FlashcardItem({ card, onEdit }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.arabic}>{card.foreignLanguage}</Text>
        <Text style={styles.meaning}>{card.localLanguage}</Text>
        {card.synonyms ? (
          <Text style={styles.synonyms}>Synonyms: {card.synonyms}</Text>
        ) : null}
      </View>
      {onEdit ? (
        <Button label="Edit" onClick={onEdit} style={styles.editButton} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.4)"
  },
  text: {
    flex: 1,
    gap: 4
  },
  arabic: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  meaning: {
    fontSize: 14,
    color: "#E5E7EB"
  },
  synonyms: {
    fontSize: 12,
    color: "#94A3B8"
  },
  editButton: {
    backgroundColor: "rgba(199, 210, 254, 0.14)"
  }
});
