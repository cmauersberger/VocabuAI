import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../../domain/dtos/flashcards/FlashCardDto";
import type { FlashCardEditDto } from "../../domain/dtos/flashcards/FlashCardEditDto";
import Button from "../../components/Button";
import FlashcardItem from "../../components/FlashcardItem";
import FlashcardForm from "./components/FlashcardForm";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";

type Props = {
  authToken: string;
};

type SortKey = "box" | "localLanguage" | "foreignLanguage" | "lastAnsweredAt";
type SortDirection = "asc" | "desc";
type SortState = { key: SortKey; direction: SortDirection } | null;

export default function EditPage({ authToken }: Props) {
  const apiBaseUrl = getApiBaseUrl();

  const [cards, setCards] = React.useState<FlashCardDto[]>([]);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [sortState, setSortState] = React.useState<SortState>(null);

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

  const handleSort = (key: SortKey) => {
    setSortState((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const sortedCards = React.useMemo(() => {
    if (!sortState) return cards;
    const sorted = [...cards];

    const directionFactor = sortState.direction === "asc" ? 1 : -1;
    const getTime = (value?: string | null) => {
      if (!value) return null;
      const parsed = new Date(value).getTime();
      return Number.isNaN(parsed) ? null : parsed;
    };

    sorted.sort((a, b) => {
      let result = 0;
      switch (sortState.key) {
        case "box":
          result = a.box - b.box;
          break;
        case "localLanguage":
          result = a.localLanguage.localeCompare(b.localLanguage, undefined, {
            sensitivity: "base"
          });
          break;
        case "foreignLanguage":
          result = a.foreignLanguage.localeCompare(b.foreignLanguage, undefined, {
            sensitivity: "base"
          });
          break;
        case "lastAnsweredAt": {
          const aTime = getTime(a.lastAnsweredAt);
          const bTime = getTime(b.lastAnsweredAt);
          if (aTime === null && bTime === null) result = 0;
          else if (aTime === null) result = 1;
          else if (bTime === null) result = -1;
          else result = aTime - bTime;
          break;
        }
        default:
          result = 0;
      }

      if (result === 0) {
        return a.id - b.id;
      }

      return result * directionFactor;
    });

    return sorted;
  }, [cards, sortState]);

  const getCaret = (key: SortKey) => {
    if (!sortState || sortState.key !== key) return null;
    return sortState.direction === "asc" ? "^" : "v";
  };

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
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSort("box")}
            style={styles.headerBox}
          >
            <Text style={styles.headerText}>
              Box {getCaret("box") ?? ""}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSort("localLanguage")}
            style={styles.headerTextColumn}
          >
            <Text style={styles.headerText}>
              Translation {getCaret("localLanguage") ?? ""}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSort("foreignLanguage")}
            style={styles.headerArabicColumn}
          >
            <Text style={[styles.headerText, styles.headerRight]}>
              Arabic {getCaret("foreignLanguage") ?? ""}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSort("lastAnsweredAt")}
            style={styles.headerLastLearned}
          >
            <Text style={[styles.headerText, styles.headerCenter]}>
              Last {getCaret("lastAnsweredAt") ?? ""}
            </Text>
          </Pressable>
          <View style={styles.headerEditSpacer} />
        </View>
        {cards.length === 0 ? (
          <Text style={styles.empty}>No flashcards yet.</Text>
        ) : (
          sortedCards.map((card) => (
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    width: "100%",
    maxWidth: 560,
    alignSelf: "center"
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#CBD5F5"
  },
  headerBox: {
    minWidth: 36,
    alignItems: "center"
  },
  headerTextColumn: {
    flex: 1
  },
  headerArabicColumn: {
    minWidth: 80
  },
  headerLastLearned: {
    minWidth: 40
  },
  headerRight: {
    textAlign: "right"
  },
  headerCenter: {
    textAlign: "center"
  },
  headerEditSpacer: {
    width: 28
  },
  status: {
    color: "#93C5FD"
  },
  empty: {
    color: "#94A3B8"
  }
});
