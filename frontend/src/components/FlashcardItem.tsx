import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../domain/dtos/flashcards/FlashCardDto";

type Props = {
  card: FlashCardDto;
  onEdit?: () => void;
};

export default function FlashcardItem({ card, onEdit }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.meaning} numberOfLines={1}>
          {card.localLanguage}
        </Text>
        {card.synonyms ? (
          <Text style={styles.synonyms}>{card.synonyms}</Text>
        ) : null}
      </View>
      <Text style={styles.arabic} numberOfLines={1}>
        {card.foreignLanguage}
      </Text>
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit flashcard"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.editButton,
            pressed ? styles.editButtonPressed : null
          ]}
        >
          <Text style={styles.editButtonLabel}>✎</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center"
  },
  text: {
    flex: 1,
    gap: 4
  },
  arabic: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "right"
  },
  meaning: {
    fontSize: 15,
    color: "#E5E7EB",
    flex: 1
  },
  synonyms: {
    fontSize: 12,
    color: "#94A3B8"
  },
  editButton: {
    minWidth: 28,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(199, 210, 254, 0.14)"
  },
  editButtonPressed: {
    opacity: 0.9
  },
  editButtonLabel: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600"
  }
});
