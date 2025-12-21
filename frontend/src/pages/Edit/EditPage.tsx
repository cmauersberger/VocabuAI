import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { VocabularyCard } from "../../domain/vocabulary-card";
import Button from "../../components/Button";
import FlashcardItem from "../../components/FlashcardItem";
import FlashcardForm, {
  FlashcardDraft
} from "./components/FlashcardForm";

export default function EditPage() {
  const [cards, setCards] = React.useState<VocabularyCard[]>([]);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const onCancel = () => {
    resetForm();
    setIsFormVisible(false);
  };

  const onSave = (draft: FlashcardDraft) => {
    const next: VocabularyCard = {
      id: editingId ?? generateId(),
      arabic: draft.arabic,
      meaning: draft.meaning,
      ...(draft.synonyms?.length ? { synonyms: draft.synonyms } : {})
    };

    setCards((prev) => {
      if (!editingId) return [next, ...prev];
      return prev.map((c) => (c.id === editingId ? next : c));
    });

    resetForm();
    setIsFormVisible(false);
  };

  const editingCard =
    editingId ? cards.find((c) => c.id === editingId) ?? null : null;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Button label="New Flashcard" onClick={openNewForm} />
      </View>

      {isFormVisible ? (
        <FlashcardForm
          initialCard={editingCard}
          onSave={onSave}
          onCancel={onCancel}
        />
      ) : null}

      <Text style={styles.sectionTitle}>Flashcards</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {cards.length === 0 ? (
          <Text style={styles.empty}>No flashcards yet.</Text>
        ) : (
          cards.map((card) => (
            <FlashcardItem
              key={card.id}
              card={card}
              onEdit={() => {
                setEditingId(card.id);
                setIsFormVisible(true);
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start"
  },
  sectionTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  list: {
    paddingVertical: 8,
    gap: 10
  },
  empty: {
    color: "#94A3B8"
  }
});
