import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../../domain/dtos/flashcards/FlashCardDto";
import type { FlashCardEditDto } from "../../domain/dtos/flashcards/FlashCardEditDto";
import Button from "../../components/Button";
import FlashcardItem from "../../components/FlashcardItem";
import FlashcardForm from "./components/FlashcardForm";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";

type Props = {
  authToken: string;
};

export default function EditPage({ authToken }: Props) {
  const apiBaseUrl = getApiBaseUrl();

  const [cards, setCards] = React.useState<FlashCardDto[]>([]);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const loadCards = React.useCallback(async () => {
    setStatus("Loading...");
    try {
      const response = await fetch(`${apiBaseUrl}/api/flashcards/getFlashCards`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!response.ok) {
        setStatus("Unable to load flashcards.");
        return;
      }

      const payload = (await response.json()) as FlashCardDto[];
      setCards(payload);
      setStatus(null);
    } catch (error) {
      setStatus("Unable to reach the API.");
    }
  }, [apiBaseUrl, authToken]);

  React.useEffect(() => {
    loadCards();
  }, [loadCards]);

  const onCancel = () => {
    resetForm();
    setIsFormVisible(false);
  };

  const onSave = async (draft: FlashCardEditDto) => {
    const payload: FlashCardEditDto = {
      ...draft,
      id: editingId ?? 0
    };

    try {
      const response = await fetch(
        editingId
          ? `${apiBaseUrl}/api/flashcards/updateFlashCard/${editingId}`
          : `${apiBaseUrl}/api/flashcards/createFlashCard`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        setStatus("Unable to save flashcard.");
        return;
      }

      const updated = (await response.json()) as FlashCardDto;

      setCards((prev) => {
        if (!editingId) return [updated, ...prev];
        return prev.map((c) => (c.id === editingId ? updated : c));
      });

      setStatus(null);
      resetForm();
      setIsFormVisible(false);
    } catch (error) {
      setStatus("Unable to reach the API.");
    }
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
        {status ? <Text style={styles.status}>{status}</Text> : null}
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
  status: {
    color: "#93C5FD"
  },
  empty: {
    color: "#94A3B8"
  }
});
