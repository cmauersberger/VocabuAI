import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../domain/dtos/flashcards/FlashCardDto";

type Props = {
  card: FlashCardDto;
  onEdit?: () => void;
  onView?: () => void;
};

const formatLastLearned = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "now";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;

  const years = Math.floor(days / 365);
  return `${years}y`;
};

export default function FlashcardItem({ card, onEdit, onView }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.boxColumn}>
        <Text style={styles.boxText}>#{card.box}</Text>
      </View>
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
      <Text style={styles.lastLearned}>
        {formatLastLearned(card.lastAnsweredAt)}
      </Text>
      <Text style={styles.createdAt}>
        {formatLastLearned(card.dateTimeCreated)}
      </Text>
      {onView ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview flashcard"
          onPress={onView}
          style={({ pressed }) => [
            styles.actionButton,
            pressed ? styles.actionButtonPressed : null
          ]}
        >
          <Text style={styles.actionButtonLabel}>🔍</Text>
        </Pressable>
      ) : null}
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit flashcard"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionButton,
            pressed ? styles.actionButtonPressed : null
          ]}
        >
          <Text style={styles.actionButtonLabel}>✎</Text>
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
  boxColumn: {
    minWidth: 36,
    alignItems: "center"
  },
  boxText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#A5B4FC"
  },
  arabic: {
    minWidth: 80,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "right"
  },
  lastLearned: {
    minWidth: 40,
    fontSize: 12,
    color: "#CBD5F5",
    textAlign: "center"
  },
  createdAt: {
    minWidth: 50,
    fontSize: 12,
    color: "#CBD5F5",
    textAlign: "center"
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
  actionButton: {
    minWidth: 28,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(199, 210, 254, 0.14)"
  },
  actionButtonPressed: {
    opacity: 0.9
  },
  actionButtonLabel: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600"
  }
});
