import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../components/Button";
import type { VocabularyCard } from "../domain/vocabulary-card";

export default function EditPage() {
  const [cards, setCards] = React.useState<VocabularyCard[]>([]);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [arabic, setArabic] = React.useState("");
  const [meaning, setMeaning] = React.useState("");
  const [synonymsText, setSynonymsText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = () => {
    setArabic("");
    setMeaning("");
    setSynonymsText("");
    setError(null);
    setEditingId(null);
  };

  const openNewForm = () => {
    resetForm();
    setIsFormVisible(true);
  };

  const openEditForm = (card: VocabularyCard) => {
    setEditingId(card.id);
    setArabic(card.arabic);
    setMeaning(card.meaning);
    setSynonymsText((card.synonyms ?? []).join(", "));
    setError(null);
    setIsFormVisible(true);
  };

  const generateId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const onCancel = () => {
    resetForm();
    setIsFormVisible(false);
  };

  const onSave = () => {
    const normalizedArabic = arabic.trim();
    const normalizedMeaning = meaning.trim();

    if (!normalizedArabic || !normalizedMeaning) {
      setError("Arabic word and meaning are required.");
      return;
    }

    const synonyms = synonymsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const next: VocabularyCard = {
      id: editingId ?? generateId(),
      arabic: normalizedArabic,
      meaning: normalizedMeaning,
      ...(synonyms.length ? { synonyms } : {})
    };

    setCards((prev) => {
      if (!editingId) return [next, ...prev];
      return prev.map((c) => (c.id === editingId ? next : c));
    });

    resetForm();
    setIsFormVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Button label="New Flashcard" onClick={openNewForm} />
      </View>

      {isFormVisible ? (
        <View style={styles.form}>
          <Text style={styles.label}>Arabic (fully vocalized)</Text>
          <TextInput
            value={arabic}
            onChangeText={setArabic}
            placeholder="مثال: القُرْآنُ"
            placeholderTextColor="#64748B"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Meaning</Text>
          <TextInput
            value={meaning}
            onChangeText={setMeaning}
            placeholder="e.g. The Qur'an / der Koran"
            placeholderTextColor="#64748B"
            style={styles.input}
            autoCapitalize="sentences"
          />

          <Text style={styles.label}>Synonyms (comma-separated)</Text>
          <TextInput
            value={synonymsText}
            onChangeText={setSynonymsText}
            placeholder="optional: scripture, revelation"
            placeholderTextColor="#64748B"
            style={styles.input}
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.formActions}>
            <Button label="Save" onClick={onSave} />
            <Button
              label="Cancel"
              onClick={onCancel}
              style={styles.cancelButton}
            />
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Flashcards</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {cards.length === 0 ? (
          <Text style={styles.empty}>No flashcards yet.</Text>
        ) : (
          cards.map((card) => (
            <View key={card.id} style={styles.cardRow}>
              <View style={styles.cardText}>
                <Text style={styles.arabic}>{card.arabic}</Text>
                <Text style={styles.meaning}>{card.meaning}</Text>
                {card.synonyms?.length ? (
                  <Text style={styles.synonyms}>
                    Synonyms: {card.synonyms.join(", ")}
                  </Text>
                ) : null}
              </View>
              <Button
                label="Edit"
                onClick={() => openEditForm(card)}
                style={styles.editButton}
              />
            </View>
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
  form: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    gap: 8
  },
  label: {
    fontSize: 13,
    color: "#C7D2FE"
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    color: "#FFFFFF"
  },
  error: {
    color: "#FCA5A5",
    fontSize: 13
  },
  formActions: {
    marginTop: 4,
    flexDirection: "row",
    gap: 10
  },
  cancelButton: {
    backgroundColor: "rgba(148, 163, 184, 0.18)"
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
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.4)"
  },
  cardText: {
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
