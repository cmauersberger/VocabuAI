import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { FlashCardDto } from "../../domain/dtos/flashcards/FlashCardDto";
import type { FlashCardEditDto } from "../../domain/dtos/flashcards/FlashCardEditDto";
import Button from "../../components/Button";
import FlashcardItem from "../../components/FlashcardItem";
import FlashcardView from "../../components/FlashcardView";
import FlashcardEditForm from "../../components/FlashcardEditForm";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";

type Props = {
  authToken: string;
};

const MAX_BOX = 5;

type SortKey =
  | "box"
  | "localLanguage"
  | "foreignLanguage"
  | "lastAnsweredAt"
  | "dateTimeCreated";
type SortDirection = "asc" | "desc";
type SortState = { key: SortKey; direction: SortDirection } | null;

export default function EditPage({ authToken }: Props) {
  const apiBaseUrl = getApiBaseUrl();

  const [cards, setCards] = React.useState<FlashCardDto[]>([]);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [sortState, setSortState] = React.useState<SortState>(null);
  const [boxFilter, setBoxFilter] = React.useState<"all" | number>("all");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [viewCard, setViewCard] = React.useState<FlashCardDto | null>(null);
  const [formResetKey, setFormResetKey] = React.useState(0);

  const resetForm = () => {
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setIsFormVisible(true);
    setFormResetKey((prev) => prev + 1);
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

  const saveCard = async (
    draft: FlashCardEditDto,
    keepFormOpen: boolean
  ) => {
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
      if (!keepFormOpen) {
        setIsFormVisible(false);
      } else {
        setFormResetKey((prev) => prev + 1);
      }
    } catch (error) {
      setStatus("Unable to reach the API.");
    }
  };

  const onSave = async (draft: FlashCardEditDto) => {
    await saveCard(draft, false);
  };

  const onSaveAndNew = async (draft: FlashCardEditDto) => {
    await saveCard(draft, true);
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

  const filteredCards = React.useMemo(() => {
    if (boxFilter === "all") return cards;
    return cards.filter((card) => card.box === boxFilter);
  }, [boxFilter, cards]);

  const sortedCards = React.useMemo(() => {
    if (!sortState) return filteredCards;
    const sorted = [...filteredCards];

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
        case "dateTimeCreated": {
          const aTime = getTime(a.dateTimeCreated);
          const bTime = getTime(b.dateTimeCreated);
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
  }, [filteredCards, sortState]);

  const displayCards = sortState ? sortedCards : filteredCards;

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
        <FlashcardEditForm
          key={`flashcard-edit-${editingId ?? "new"}-${formResetKey}`}
          initialCard={editingCard}
          onSave={onSave}
          onSaveAndNew={onSaveAndNew}
          onCancel={onCancel}
          showSaveAndNew={!editingId}
        />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Flashcards</Text>
        <View style={styles.filterContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsFilterOpen((prev) => !prev)}
            style={({ pressed }) => [
              styles.filterButton,
              pressed ? styles.filterButtonPressed : null
            ]}
          >
            <Text style={styles.filterButtonText}>
              Box: {boxFilter === "all" ? "All" : `#${boxFilter}`} v
            </Text>
          </Pressable>
          {isFilterOpen ? (
            <View style={styles.filterMenu}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setBoxFilter("all");
                  setIsFilterOpen(false);
                }}
                style={styles.filterOption}
              >
                <Text style={styles.filterOptionText}>All boxes</Text>
              </Pressable>
              {Array.from({ length: MAX_BOX }, (_, index) => index + 1).map(
                (box) => (
                  <Pressable
                    accessibilityRole="button"
                    key={box}
                    onPress={() => {
                      setBoxFilter(box);
                      setIsFilterOpen(false);
                    }}
                    style={styles.filterOption}
                  >
                    <Text style={styles.filterOptionText}>Box #{box}</Text>
                  </Pressable>
                )
              )}
            </View>
          ) : null}
        </View>
      </View>

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
              Learned {getCaret("lastAnsweredAt") ?? ""}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => handleSort("dateTimeCreated")}
            style={styles.headerCreated}
          >
            <Text style={[styles.headerText, styles.headerCenter]}>
              Created {getCaret("dateTimeCreated") ?? ""}
            </Text>
          </Pressable>
          <View style={styles.headerEditSpacer} />
        </View>
        {displayCards.length === 0 ? (
          <Text style={styles.empty}>No flashcards yet.</Text>
        ) : (
          displayCards.map((card) => (
            <FlashcardItem
              key={card.id}
              card={card}
              onView={() => setViewCard(card)}
              onEdit={() => {
                setEditingId(card.id);
                setIsFormVisible(true);
              }}
            />
          ))
        )}
      </ScrollView>

      {isFilterOpen ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsFilterOpen(false)}
          style={styles.filterBackdrop}
        />
      ) : null}

      <FlashcardView card={viewCard} onClose={() => setViewCard(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8,
    position: "relative"
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 12
  },
  sectionHeader: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    position: "relative",
    zIndex: 20
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  list: {
    paddingVertical: 8,
    gap: 10,
    zIndex: 1
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
  headerCreated: {
    minWidth: 50
  },
  headerRight: {
    textAlign: "right"
  },
  headerCenter: {
    textAlign: "center"
  },
  headerEditSpacer: {
    width: 64
  },
  filterContainer: {
    alignItems: "flex-end",
    position: "relative",
    zIndex: 30
  },
  filterBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.6)"
  },
  filterButtonPressed: {
    opacity: 0.9
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E5E7EB"
  },
  filterMenu: {
    position: "absolute",
    top: 36,
    right: 0,
    zIndex: 40,
    elevation: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    minWidth: 140
  },
  filterOption: {
    paddingVertical: 6,
    paddingHorizontal: 12
  },
  filterOptionText: {
    fontSize: 13,
    color: "#E5E7EB"
  },
  status: {
    color: "#93C5FD"
  },
  empty: {
    color: "#94A3B8",
    textAlign: "center"
  }
});
