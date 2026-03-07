import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../../../domain/dtos/flashcards/FlashCardDto";

export type DuplicatePair = {
  first: FlashCardDto;
  second: FlashCardDto;
  localMatch: boolean;
  foreignMatch: boolean;
};

type Props = {
  isVisible: boolean;
  duplicatePairs: DuplicatePair[];
  deletingCardId: number | null;
  onClose: () => void;
  onEdit: (card: FlashCardDto) => void;
  onDelete: (card: FlashCardDto) => void;
};

const getDuplicatePairLabel = (pair: DuplicatePair): string => {
  if (pair.localMatch && pair.foreignMatch) {
    return "Match in translation and foreign term";
  }
  if (pair.localMatch) {
    return "Match in translation";
  }
  return "Match in foreign term";
};

export default function FlashcardDuplicatesOverlay({
  isVisible,
  duplicatePairs,
  deletingCardId,
  onClose,
  onEdit,
  onDelete
}: Props) {
  if (!isVisible) return null;

  return (
    <View style={styles.duplicateOverlay} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={styles.duplicateBackdrop}
      />
      <View style={styles.duplicatePanel}>
        <View style={styles.duplicateHeader}>
          <Text style={styles.duplicateTitle}>Potential duplicates</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.duplicateCloseButton,
              pressed ? styles.duplicateCloseButtonPressed : null
            ]}
          >
            <Text style={styles.duplicateCloseButtonText}>Close</Text>
          </Pressable>
        </View>
        <Text style={styles.duplicateDescription}>
          Two flashcards are listed together when one term is contained in the
          other at word boundaries.
        </Text>
        <ScrollView contentContainerStyle={styles.duplicateList}>
          {duplicatePairs.length === 0 ? (
            <Text style={styles.empty}>No potential duplicates found.</Text>
          ) : (
            duplicatePairs.map((pair) => (
              <View
                key={`${pair.first.id}-${pair.second.id}`}
                style={styles.duplicatePairCard}
              >
                <Text style={styles.duplicatePairLabel}>
                  {getDuplicatePairLabel(pair)}
                </Text>
                {[pair.first, pair.second].map((card) => (
                  <View key={card.id} style={styles.duplicateItem}>
                    <View style={styles.duplicateItemTextBlock}>
                      <Text style={styles.duplicateItemLocal}>
                        {card.localLanguage}
                      </Text>
                      <Text style={styles.duplicateItemForeign}>
                        {card.foreignLanguage}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onEdit(card)}
                      style={({ pressed }) => [
                        styles.duplicateActionButton,
                        pressed ? styles.duplicateActionButtonPressed : null
                      ]}
                    >
                      <Text style={styles.duplicateActionText}>Edit</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onDelete(card)}
                      disabled={deletingCardId === card.id}
                      style={({ pressed }) => [
                        styles.duplicateDeleteButton,
                        deletingCardId === card.id
                          ? styles.duplicateDeleteButtonDisabled
                          : null,
                        pressed && deletingCardId !== card.id
                          ? styles.duplicateActionButtonPressed
                          : null
                      ]}
                    >
                      <Text style={styles.duplicateActionText}>
                        {deletingCardId === card.id ? "Deleting..." : "Delete"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: "#94A3B8",
    textAlign: "center"
  },
  duplicateOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 55
  },
  duplicateBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.74)"
  },
  duplicatePanel: {
    width: "92%",
    maxWidth: 620,
    maxHeight: "86%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    gap: 10
  },
  duplicateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  duplicateTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  duplicateCloseButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(148, 163, 184, 0.16)"
  },
  duplicateCloseButtonPressed: {
    opacity: 0.9
  },
  duplicateCloseButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E2E8F0"
  },
  duplicateDescription: {
    fontSize: 12,
    color: "#94A3B8"
  },
  duplicateList: {
    gap: 10,
    paddingBottom: 6
  },
  duplicatePairCard: {
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(30, 41, 59, 0.45)"
  },
  duplicatePairLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C7D2FE"
  },
  duplicateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.18)",
    backgroundColor: "rgba(15, 23, 42, 0.5)"
  },
  duplicateItemTextBlock: {
    flex: 1,
    gap: 2
  },
  duplicateItemLocal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F8FAFC"
  },
  duplicateItemForeign: {
    fontSize: 14,
    color: "#E2E8F0"
  },
  duplicateActionButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(199, 210, 254, 0.2)"
  },
  duplicateDeleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "rgba(252, 165, 165, 0.2)"
  },
  duplicateDeleteButtonDisabled: {
    opacity: 0.6
  },
  duplicateActionButtonPressed: {
    opacity: 0.9
  },
  duplicateActionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F8FAFC"
  }
});
