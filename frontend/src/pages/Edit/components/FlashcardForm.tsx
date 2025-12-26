import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../../components/Button";
import type { FlashCardDto } from "../../../domain/dtos/flashcards/FlashCardDto";
import type { FlashCardEditDto } from "../../../domain/dtos/flashcards/FlashCardEditDto";

type Props = {
  initialCard: FlashCardDto | null;
  onSave: (draft: FlashCardEditDto) => void;
  onCancel: () => void;
};

export default function FlashcardForm({ initialCard, onSave, onCancel }: Props) {
  const [foreignLanguage, setForeignLanguage] = React.useState("");
  const [localLanguage, setLocalLanguage] = React.useState("");
  const [synonymsText, setSynonymsText] = React.useState("");
  const [annotation, setAnnotation] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setForeignLanguage(initialCard?.foreignLanguage ?? "");
    setLocalLanguage(initialCard?.localLanguage ?? "");
    setSynonymsText(initialCard?.synonyms ?? "");
    setAnnotation(initialCard?.annotation ?? "");
    setError(null);
  }, [initialCard]);

  const handleSave = () => {
    const normalizedForeignLanguage = foreignLanguage.trim();
    const normalizedLocalLanguage = localLanguage.trim();
    const normalizedSynonyms = synonymsText.trim();
    const normalizedAnnotation = annotation.trim();

    if (!normalizedForeignLanguage || !normalizedLocalLanguage) {
      setError("Arabic word and meaning are required.");
      return;
    }

    onSave({
      id: initialCard?.id ?? 0,
      foreignLanguage: normalizedForeignLanguage,
      localLanguage: normalizedLocalLanguage,
      synonyms: normalizedSynonyms.length ? normalizedSynonyms : null,
      annotation: normalizedAnnotation.length ? normalizedAnnotation : null
    });
  };

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Arabic (fully vocalized)</Text>
      <TextInput
        value={foreignLanguage}
        onChangeText={setForeignLanguage}
        placeholder="مثال: القُرْآن"
        placeholderTextColor="#64748B"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.label}>Meaning</Text>
      <TextInput
        value={localLanguage}
        onChangeText={setLocalLanguage}
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

      <Text style={styles.label}>Annotation</Text>
      <TextInput
        value={annotation}
        onChangeText={setAnnotation}
        placeholder="optional: notes, usage, context"
        placeholderTextColor="#64748B"
        style={styles.input}
        autoCapitalize="sentences"
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
