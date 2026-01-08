import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "./Button";
import type { FlashCardDto } from "../domain/dtos/flashcards/FlashCardDto";
import type { FlashCardEditDto } from "../domain/dtos/flashcards/FlashCardEditDto";

type Props = {
  initialCard: FlashCardDto | null;
  defaultForeignLanguageCode?: string;
  defaultLocalLanguageCode?: string;
  onSave: (draft: FlashCardEditDto) => void;
  onSaveAndNew?: (draft: FlashCardEditDto) => void;
  onCancel: () => void;
  showSaveAndNew?: boolean;
};

export default function FlashcardEditForm({
  initialCard,
  defaultForeignLanguageCode,
  defaultLocalLanguageCode,
  onSave,
  onSaveAndNew,
  onCancel,
  showSaveAndNew
}: Props) {
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

  const foreignLanguageCode =
    initialCard?.foreignLanguageCode ?? defaultForeignLanguageCode ?? "";
  const localLanguageCode =
    initialCard?.localLanguageCode ?? defaultLocalLanguageCode ?? "";

  const formatLabel = (label: string, code: string) =>
    code ? `${label} (${code.toUpperCase()})` : label;

  const buildDraft = (): FlashCardEditDto | null => {
    const normalizedForeignLanguage = foreignLanguage.trim();
    const normalizedLocalLanguage = localLanguage.trim();
    const normalizedSynonyms = synonymsText.trim();
    const normalizedAnnotation = annotation.trim();

    if (!foreignLanguageCode || !localLanguageCode) {
      setError("Language settings are missing. Please reload and try again.");
      return null;
    }

    if (!normalizedForeignLanguage || !normalizedLocalLanguage) {
      setError("Foreign and local terms are required.");
      return null;
    }

    return {
      id: initialCard?.id ?? 0,
      foreignLanguage: normalizedForeignLanguage,
      localLanguage: normalizedLocalLanguage,
      foreignLanguageCode,
      localLanguageCode,
      synonyms: normalizedSynonyms.length ? normalizedSynonyms : null,
      annotation: normalizedAnnotation.length ? normalizedAnnotation : null
    };
  };

  const handleSave = () => {
    const draft = buildDraft();
    if (!draft) return;
    onSave(draft);
  };

  const handleSaveAndNew = () => {
    if (!onSaveAndNew) return;
    const draft = buildDraft();
    if (!draft) return;
    onSaveAndNew(draft);
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <View style={styles.backdrop} />
      <View style={styles.form}>
        <Text style={styles.label}>
          {formatLabel("Foreign term", foreignLanguageCode)}
        </Text>
        <TextInput
          value={foreignLanguage}
          onChangeText={setForeignLanguage}
          placeholder="مثال: الْقُرْآنُ"
          placeholderTextColor="#64748B"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>
          {formatLabel("Local term", localLanguageCode)}
        </Text>
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
          <Button
            label="Cancel"
            onClick={onCancel}
            style={styles.secondaryButton}
          />
          <Button label="Save" onClick={handleSave} />
          {showSaveAndNew ? (
            <Button
              label="Save & New"
              onClick={handleSaveAndNew}
              style={styles.secondaryButton}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 60
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.68)"
  },
  form: {
    width: "90%",
    maxWidth: 520,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#111827",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)"
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
    gap: 10,
    justifyContent: "center"
  },
  secondaryButton: {
    backgroundColor: "rgba(148, 163, 184, 0.18)"
  }
});
