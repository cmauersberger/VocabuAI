import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../../components/Button";
import type { VocabularyCard } from "../../../domain/vocabulary-card";

export type FlashcardDraft = {
  arabic: string;
  meaning: string;
  synonyms?: string[];
};

type Props = {
  initialCard: VocabularyCard | null;
  onSave: (draft: FlashcardDraft) => void;
  onCancel: () => void;
};

export default function FlashcardForm({ initialCard, onSave, onCancel }: Props) {
  const [arabic, setArabic] = React.useState("");
  const [meaning, setMeaning] = React.useState("");
  const [synonymsText, setSynonymsText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setArabic(initialCard?.arabic ?? "");
    setMeaning(initialCard?.meaning ?? "");
    setSynonymsText((initialCard?.synonyms ?? []).join(", "));
    setError(null);
  }, [initialCard]);

  const handleSave = () => {
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

    onSave({
      arabic: normalizedArabic,
      meaning: normalizedMeaning,
      ...(synonyms.length ? { synonyms } : {})
    });
  };

  return (
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

      <View style={styles.actions}>
        <Button label="Save" onClick={handleSave} />
        <Button label="Cancel" onClick={onCancel} style={styles.cancelButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  actions: {
    marginTop: 4,
    flexDirection: "row",
    gap: 10
  },
  cancelButton: {
    backgroundColor: "rgba(148, 163, 184, 0.18)"
  }
});

