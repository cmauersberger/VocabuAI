import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import type { FlashCardDto } from "../../domain/dtos/flashcards/FlashCardDto";
import type { FlashCardEditDto } from "../../domain/dtos/flashcards/FlashCardEditDto";
import Button from "../../components/Button";
import FlashcardItem from "../../components/FlashcardItem";
import FlashcardView from "../../components/FlashcardView";
import FlashcardEditForm from "../../components/FlashcardEditForm";
import FlashcardDuplicatesOverlay, {
  type DuplicatePair
} from "./components/FlashcardDuplicatesOverlay";
import FlashcardOverviewOverlay from "./components/FlashcardOverviewOverlay";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import { arePotentialDuplicateTerms } from "../../infrastructure/textNormalization";
import type { UserSettingsDto } from "../../domain/dtos/UserSettingsDto";

type Props = {
  authToken: string;
  onAuthFailure?: () => void;
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
type OverviewScope = "all" | "last40";

const OVERVIEW_LAST_ADDED_LIMIT = 40;
const OVERVIEW_MAX_COLUMN_WIDTH = 64;

const isAuthFailureResponse = (response: Response) =>
  response.status === 401 || response.status === 403;

const getCardSummaryLabel = (card: FlashCardDto): string => {
  return `${card.localLanguage} / ${card.foreignLanguage}`;
};

const normalizeOverviewValue = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const truncateOverviewValue = (value: string, width: number): string => {
  if (value.length <= width) return value;
  if (width <= 3) return value.slice(0, width);
  return `${value.slice(0, width - 3)}...`;
};

const parseDateTimeCreated = (card: FlashCardDto): number | null => {
  if (!card.dateTimeCreated) return null;
  const parsed = new Date(card.dateTimeCreated).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const sortByNewestCreated = (a: FlashCardDto, b: FlashCardDto): number => {
  const aTime = parseDateTimeCreated(a);
  const bTime = parseDateTimeCreated(b);

  if (aTime === null && bTime === null) return b.id - a.id;
  if (aTime === null) return 1;
  if (bTime === null) return -1;

  if (aTime === bTime) return b.id - a.id;
  return bTime - aTime;
};

const getOverviewCards = (
  cards: FlashCardDto[],
  scope: OverviewScope
): FlashCardDto[] => {
  if (scope === "all") return cards;
  return [...cards]
    .sort(sortByNewestCreated)
    .slice(0, OVERVIEW_LAST_ADDED_LIMIT);
};

const buildOverviewTable = (
  cards: FlashCardDto[],
  scope: OverviewScope
): string => {
  const selectedCards = getOverviewCards(cards, scope);
  const rows = selectedCards.map((card) => ({
    base: normalizeOverviewValue(card.localLanguage),
    target: normalizeOverviewValue(card.foreignLanguage)
  }));
  const baseHeader = "Base";
  const targetHeader = "Target";

  const baseWidth = Math.max(
    baseHeader.length,
    ...rows.map((row) => Math.min(row.base.length, OVERVIEW_MAX_COLUMN_WIDTH))
  );
  const targetWidth = Math.max(
    targetHeader.length,
    ...rows.map((row) => Math.min(row.target.length, OVERVIEW_MAX_COLUMN_WIDTH))
  );

  const lines = [
    `${baseHeader.padEnd(baseWidth, " ")} | ${targetHeader.padEnd(
      targetWidth,
      " "
    )}`,
    `${"-".repeat(baseWidth)}-+-${"-".repeat(targetWidth)}`
  ];

  if (rows.length === 0) {
    const emptyText = truncateOverviewValue("(No flashcards)", baseWidth).padEnd(
      baseWidth,
      " "
    );
    lines.push(`${emptyText} | ${"".padEnd(targetWidth, " ")}`);
    return lines.join("\n");
  }

  rows.forEach((row) => {
    const baseText = truncateOverviewValue(row.base, baseWidth).padEnd(
      baseWidth,
      " "
    );
    const targetText = truncateOverviewValue(row.target, targetWidth).padEnd(
      targetWidth,
      " "
    );
    lines.push(`${baseText} | ${targetText}`);
  });

  return lines.join("\n");
};

export default function EditPage({ authToken, onAuthFailure }: Props) {
  const apiBaseUrl = getApiBaseUrl();
  const handleAuthFailure = React.useCallback(() => {
    if (!onAuthFailure) return false;
    onAuthFailure();
    return true;
  }, [onAuthFailure]);

  const [cards, setCards] = React.useState<FlashCardDto[]>([]);
  const [userSettings, setUserSettings] = React.useState<UserSettingsDto | null>(
    null
  );
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [sortState, setSortState] = React.useState<SortState>(null);
  const [boxFilter, setBoxFilter] = React.useState<"all" | number>("all");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);
  const [viewCard, setViewCard] = React.useState<FlashCardDto | null>(null);
  const [formResetKey, setFormResetKey] = React.useState(0);
  const [isSeeding, setIsSeeding] = React.useState<null | "en" | "fr">(null);
  const [isDuplicateOverlayOpen, setIsDuplicateOverlayOpen] = React.useState(false);
  const [deletingCardId, setDeletingCardId] = React.useState<number | null>(null);
  const [isOverviewMenuOpen, setIsOverviewMenuOpen] = React.useState(false);
  const [isOverviewOverlayOpen, setIsOverviewOverlayOpen] = React.useState(false);
  const [overviewScope, setOverviewScope] = React.useState<OverviewScope>("all");

  const confirmDeleteCard = React.useCallback(async (card: FlashCardDto) => {
    const confirmationMessage =
      "This action is irreversible. Do you really want to delete this flashcard?";

    if (Platform.OS === "web") {
      if (typeof window === "undefined" || typeof window.confirm !== "function") {
        return false;
      }
      return window.confirm(`${confirmationMessage}\n\n${getCardSummaryLabel(card)}`);
    }

    return new Promise<boolean>((resolve) => {
      Alert.alert("Delete flashcard?", confirmationMessage, [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => resolve(false)
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => resolve(true)
        }
      ]);
    });
  }, []);

  const resetForm = () => {
    setEditingId(null);
  };

  const openNewForm = () => {
    setIsOverviewMenuOpen(false);
    resetForm();
    setIsFormVisible(true);
    setFormResetKey((prev) => prev + 1);
  };

  const loadUserSettings = React.useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/users/settings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
      if (!response.ok) {
        setStatus("Unable to load user settings.");
        return;
      }

      const payload = (await response.json()) as UserSettingsDto;
      setUserSettings(payload);
    } catch (error) {
      if (handleAuthFailure()) return;
      setStatus("Unable to reach the API.");
    }
  }, [apiBaseUrl, authToken, handleAuthFailure]);

  const loadCards = React.useCallback(async () => {
    setStatus("Loading...");
    try {
      const response = await fetch(`${apiBaseUrl}/flashcards/list`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
      if (!response.ok) {
        setStatus("Unable to load flashcards.");
        return;
      }

      const payload = (await response.json()) as FlashCardDto[];
      setCards(payload);
      setStatus(null);
    } catch (error) {
      if (handleAuthFailure()) return;
      setStatus("Unable to reach the API.");
    }
  }, [apiBaseUrl, authToken, handleAuthFailure]);

  React.useEffect(() => {
    loadCards();
  }, [loadCards]);

  React.useEffect(() => {
    loadUserSettings();
  }, [loadUserSettings]);

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
          ? `${apiBaseUrl}/flashcards/update/${editingId}`
          : `${apiBaseUrl}/flashcards/create`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
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
      if (handleAuthFailure()) return;
      setStatus("Unable to reach the API.");
    }
  };

  const onSave = async (draft: FlashCardEditDto) => {
    await saveCard(draft, false);
  };

  const onSaveAndNew = async (draft: FlashCardEditDto) => {
    await saveCard(draft, true);
  };

  const createSampleCards = async (target: "en" | "fr") => {
    setIsSeeding(target);
    setStatus(`Creating sample flashcards DE->${target.toUpperCase()}...`);
    try {
      const endpoint = target === "en" ? "de-to-en" : "de-to-fr";
      const response = await fetch(
        `${apiBaseUrl}/flashcards/samples/${endpoint}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (isAuthFailureResponse(response)) {
        if (handleAuthFailure()) return;
      }
      if (!response.ok) {
        setStatus("Unable to create sample flashcards.");
        return;
      }

      await loadCards();
      setStatus(null);
    } catch (error) {
      if (handleAuthFailure()) return;
      setStatus("Unable to reach the API.");
    } finally {
      setIsSeeding(null);
    }
  };

  const deleteCard = React.useCallback(
    async (card: FlashCardDto) => {
      const confirmed = await confirmDeleteCard(card);
      if (!confirmed) return;

      setDeletingCardId(card.id);
      setStatus("Deleting flashcard...");
      try {
        const response = await fetch(`${apiBaseUrl}/flashcards/delete/${card.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authToken}` }
        });

        if (isAuthFailureResponse(response)) {
          if (handleAuthFailure()) return;
        }
        if (!response.ok) {
          setStatus("Unable to delete flashcard.");
          return;
        }

        setCards((prev) => prev.filter((item) => item.id !== card.id));
        setStatus(null);
      } catch (error) {
        if (handleAuthFailure()) return;
        setStatus("Unable to reach the API.");
      } finally {
        setDeletingCardId(null);
      }
    },
    [apiBaseUrl, authToken, confirmDeleteCard, handleAuthFailure]
  );

  const duplicatePairs = React.useMemo(() => {
    const pairs: DuplicatePair[] = [];

    for (let i = 0; i < cards.length; i += 1) {
      for (let j = i + 1; j < cards.length; j += 1) {
        const first = cards[i];
        const second = cards[j];
        const localMatch = arePotentialDuplicateTerms(
          first.localLanguage,
          first.localLanguageCode,
          second.localLanguage,
          second.localLanguageCode
        );
        const foreignMatch = arePotentialDuplicateTerms(
          first.foreignLanguage,
          first.foreignLanguageCode,
          second.foreignLanguage,
          second.foreignLanguageCode
        );

        if (localMatch || foreignMatch) {
          pairs.push({ first, second, localMatch, foreignMatch });
        }
      }
    }

    return pairs;
  }, [cards]);

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

  const overviewText = React.useMemo(() => {
    return buildOverviewTable(cards, overviewScope);
  }, [cards, overviewScope]);

  const openOverview = React.useCallback((scope: OverviewScope) => {
    setOverviewScope(scope);
    setIsOverviewMenuOpen(false);
    setIsOverviewOverlayOpen(true);
  }, []);

  return (
    <View style={styles.container}>
      {isFormVisible ? (
        <FlashcardEditForm
          key={`flashcard-edit-${editingId ?? "new"}-${formResetKey}`}
          initialCard={editingCard}
          defaultForeignLanguageCode={
            userSettings?.defaultForeignFlashCardLanguage
          }
          defaultLocalLanguageCode={userSettings?.defaultLocalFlashCardLanguage}
          onSave={onSave}
          onSaveAndNew={onSaveAndNew}
          onCancel={onCancel}
          showSaveAndNew={!editingId}
        />
      ) : null}

      {isFilterOpen && Platform.OS !== "web" ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsFilterOpen(false)}
          style={styles.filterBackdrop}
        />
      ) : null}
      {isOverviewMenuOpen ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setIsOverviewMenuOpen(false)}
          style={styles.overviewMenuBackdrop}
        />
      ) : null}

      <View style={styles.tableArea}>
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
        <ScrollView contentContainerStyle={styles.list}>
          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.empty}>No flashcards yet.</Text>
              <Button
                label={
                  isSeeding === "en"
                    ? "Creating sample flashcards..."
                    : "Create 30 sample vocabulary flashcards DE->EN"
                }
                onClick={() => createSampleCards("en")}
                style={styles.emptyButton}
                disabled={isSeeding !== null}
              />
              <Button
                label={
                  isSeeding === "fr"
                    ? "Creating sample flashcards..."
                    : "Create 30 sample vocabulary flashcards DE->FR"
                }
                onClick={() => createSampleCards("fr")}
                style={styles.emptyButton}
                disabled={isSeeding !== null}
              />
            </View>
          ) : displayCards.length === 0 ? (
            <Text style={styles.empty}>No flashcards in this filter.</Text>
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
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.bottomActions}>
          <View style={styles.overviewMenuAnchor}>
            <Button
              label="Show overview"
              onClick={() => {
                setIsFilterOpen(false);
                setIsOverviewMenuOpen((prev) => !prev);
              }}
              style={styles.secondaryButton}
              disabled={cards.length === 0}
            />
            {isOverviewMenuOpen ? (
              <View style={styles.overviewMenu}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openOverview("all")}
                  style={({ pressed }) => [
                    styles.overviewMenuOption,
                    pressed ? styles.overviewMenuOptionPressed : null
                  ]}
                >
                  <Text style={styles.overviewMenuOptionText}>
                    Include all flashcards
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openOverview("last40")}
                  style={({ pressed }) => [
                    styles.overviewMenuOption,
                    pressed ? styles.overviewMenuOptionPressed : null
                  ]}
                >
                  <Text style={styles.overviewMenuOptionText}>
                    Include last 40 added
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <Button
            label="Find duplicates"
            onClick={() => {
              setIsOverviewMenuOpen(false);
              setIsDuplicateOverlayOpen(true);
            }}
            style={styles.secondaryButton}
            disabled={cards.length < 2}
          />
        </View>
        <Button
          label="New Flashcard"
          onClick={openNewForm}
          style={styles.centeredButton}
        />
      </View>

      <FlashcardDuplicatesOverlay
        isVisible={isDuplicateOverlayOpen}
        duplicatePairs={duplicatePairs}
        deletingCardId={deletingCardId}
        onClose={() => setIsDuplicateOverlayOpen(false)}
        onEdit={(card) => {
          setEditingId(card.id);
          setIsFormVisible(true);
        }}
        onDelete={(card) => {
          void deleteCard(card);
        }}
      />
      <FlashcardOverviewOverlay
        isVisible={isOverviewOverlayOpen}
        overviewText={overviewText}
        onClose={() => setIsOverviewOverlayOpen(false)}
      />

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
  tableArea: {
    flex: 1
  },
  bottomBar: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    paddingTop: 8,
    width: "100%",
    zIndex: 35
  },
  bottomActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  centeredButton: {
    alignSelf: "center"
  },
  secondaryButton: {
    backgroundColor: "rgba(148, 163, 184, 0.18)"
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
  overviewMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 32
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
  overviewMenuAnchor: {
    position: "relative",
    zIndex: 36
  },
  overviewMenu: {
    position: "absolute",
    left: 0,
    bottom: 52,
    zIndex: 37,
    elevation: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    minWidth: 218,
    overflow: "hidden"
  },
  overviewMenuOption: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  overviewMenuOptionPressed: {
    backgroundColor: "rgba(148, 163, 184, 0.2)"
  },
  overviewMenuOptionText: {
    fontSize: 13,
    color: "#E5E7EB"
  },
  status: {
    color: "#93C5FD"
  },
  empty: {
    color: "#94A3B8",
    textAlign: "center"
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12
  },
  emptyButton: {
    alignSelf: "center"
  }
});
