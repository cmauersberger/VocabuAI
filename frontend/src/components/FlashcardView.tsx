import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../domain/dtos/flashcards/FlashCardDto";

type Props = {
  card: FlashCardDto | null;
  onClose: () => void;
};

export default function FlashcardView({ card, onClose }: Props) {
  if (!card) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      />
      <View style={styles.card}>
        <Text style={styles.term}>{card.localLanguage}</Text>
        <Text style={styles.term}>{card.foreignLanguage}</Text>
        {card.synonyms ? <Text style={styles.meta}>{card.synonyms}</Text> : null}
        {card.annotation ? (
          <Text style={styles.meta}>{card.annotation}</Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            pressed ? styles.closeButtonPressed : null
          ]}
        >
          <Text style={styles.closeLabel}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.68)"
  },
  card: {
    width: "88%",
    maxWidth: 360,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    gap: 16,
    alignItems: "center"
  },
  term: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F8FAFC",
    textAlign: "center"
  },
  meta: {
    fontSize: 14,
    color: "#CBD5F5",
    textAlign: "center"
  },
  closeButton: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(148, 163, 184, 0.18)"
  },
  closeButtonPressed: {
    opacity: 0.9
  },
  closeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E5E7EB"
  }
});
