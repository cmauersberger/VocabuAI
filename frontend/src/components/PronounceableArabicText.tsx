import React from "react";
import {
  Linking,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from "react-native";
import type { PronunciationLookupResponseDto } from "../domain/dtos/PronunciationLookupResponseDto";
import { isArabicLanguageCode } from "../infrastructure/textNormalization";
import { lookupPronunciationAsync } from "../infrastructure/pronunciationLookup";
import { playPronunciationAudioAsync } from "../infrastructure/pronunciationPlayer";

const ARABIC_LETTER_REGEX = /[\u0600-\u06FF]/;
const ARABIC_LOOKUP_SANITIZER_REGEX = /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g;

type Props = {
  apiBaseUrl: string;
  authToken: string;
  text: string;
  languageCode: string;
  variant?: "term" | "tokenized";
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

type TokenItem = {
  display: string;
  lookupTerm: string;
};

export default function PronounceableArabicText({
  apiBaseUrl,
  authToken,
  text,
  languageCode,
  variant = "term",
  textStyle,
  containerStyle
}: Props) {
  const trimmed = text.trim();
  const tokenItems = React.useMemo(() => tokenizeArabicText(trimmed), [trimmed]);

  if (!trimmed || !isArabicLanguageCode(languageCode)) {
    return <Text style={textStyle}>{text}</Text>;
  }

  if (variant === "tokenized") {
    return (
      <View style={[styles.tokenWrap, containerStyle]}>
        {tokenItems.map((item, index) => (
          <View key={`${item.display}-${index}`} style={styles.tokenRow}>
            <Text style={textStyle}>{item.display}</Text>
            <PronunciationButton
              apiBaseUrl={apiBaseUrl}
              authToken={authToken}
              term={item.lookupTerm}
              languageCode={languageCode}
            />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.termRow, containerStyle]}>
      <Text style={[styles.termText, textStyle]}>{text}</Text>
      <PronunciationButton
        apiBaseUrl={apiBaseUrl}
        authToken={authToken}
        term={trimmed}
        languageCode={languageCode}
      />
    </View>
  );
}

type PronunciationButtonProps = {
  apiBaseUrl: string;
  authToken: string;
  term: string;
  languageCode: string;
};

function PronunciationButton({
  apiBaseUrl,
  authToken,
  term,
  languageCode
}: PronunciationButtonProps) {
  const [lookup, setLookup] = React.useState<PronunciationLookupResponseDto | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUnavailable, setIsUnavailable] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const loadLookupAsync = async () => {
    const nextLookup =
      lookup ??
      (await lookupPronunciationAsync(apiBaseUrl, authToken, term, languageCode));
    setLookup(nextLookup);

    if (!nextLookup.isAvailable || !nextLookup.audioUrl) {
      setIsUnavailable(true);
      return null;
    }

    return nextLookup;
  };

  const loadAndPlay = async () => {
    if (isUnavailable || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const nextLookup = await loadLookupAsync();
      if (!nextLookup) {
        return;
      }

      const audioUrl = nextLookup.audioUrl;
      if (!audioUrl) {
        return;
      }

      await playPronunciationAudioAsync(audioUrl);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDetails = async () => {
    if (isDetailsOpen) {
      setIsDetailsOpen(false);
      return;
    }

    if (isUnavailable || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const nextLookup = await loadLookupAsync();
      if (!nextLookup) {
        return;
      }

      setIsDetailsOpen(true);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const openAttributionLink = async () => {
    const attributionUrl = lookup?.attributionUrl;
    if (!attributionUrl) {
      return;
    }

    try {
      await Linking.openURL(attributionUrl);
    } catch {
    }
  };

  const buttonUnavailable = isUnavailable || (lookup !== null && !lookup.isAvailable);
  const label = isLoading ? "..." : buttonUnavailable ? "N/A" : "Play";

  return (
    <View style={styles.buttonStack}>
      <View style={styles.buttonRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Play pronunciation for ${term}`}
          onPress={() => {
            void loadAndPlay();
          }}
          disabled={isLoading || buttonUnavailable}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
            buttonUnavailable ? styles.buttonDisabled : null
          ]}
        >
          <Text style={styles.buttonLabel}>{label}</Text>
        </Pressable>
        {lookup?.isAvailable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Show pronunciation details for ${term}`}
            onPress={() => {
              void toggleDetails();
            }}
            style={({ pressed }) => [
              styles.infoButton,
              pressed ? styles.buttonPressed : null
            ]}
          >
            <Text style={styles.infoButtonLabel}>
              {isDetailsOpen ? "Hide" : "Info"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {isDetailsOpen && lookup?.isAvailable ? (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTerm}>{lookup.term}</Text>
          <Text style={styles.detailsText}>
            License: {lookup.licenseShortName ?? "Unknown"}
          </Text>
          <Text style={styles.detailsText}>
            Creator: {lookup.creator ?? "Unknown"}
          </Text>
          {lookup.credit ? (
            <Text style={styles.detailsText}>Credit: {lookup.credit}</Text>
          ) : null}
          <Text style={styles.detailsText}>
            Source: {lookup.source ?? "wikimedia-commons"}
          </Text>
          {lookup.attributionUrl ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => {
                void openAttributionLink();
              }}
              style={({ pressed }) => [
                styles.detailsLinkButton,
                pressed ? styles.buttonPressed : null
              ]}
            >
              <Text style={styles.detailsLinkText}>Open source</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function tokenizeArabicText(text: string): TokenItem[] {
  return text
    .split(/\s+/)
    .map((part) => ({
      display: part,
      lookupTerm: part.replace(ARABIC_LOOKUP_SANITIZER_REGEX, "")
    }))
    .filter((part) => part.lookupTerm && ARABIC_LETTER_REGEX.test(part.lookupTerm));
}

const styles = StyleSheet.create({
  termRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8
  },
  termText: {
    flexShrink: 1
  },
  tokenWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8
  },
  tokenRow: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 6
  },
  buttonStack: {
    alignItems: "flex-end",
    gap: 6
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  button: {
    minWidth: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.45)",
    backgroundColor: "rgba(56, 189, 248, 0.18)"
  },
  buttonPressed: {
    opacity: 0.85
  },
  buttonDisabled: {
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(71, 85, 105, 0.28)"
  },
  buttonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E0F2FE",
    textAlign: "center",
    textTransform: "uppercase"
  },
  infoButton: {
    minWidth: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
    backgroundColor: "rgba(51, 65, 85, 0.55)"
  },
  infoButtonLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#E2E8F0",
    textAlign: "center",
    textTransform: "uppercase"
  },
  detailsCard: {
    maxWidth: 220,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4
  },
  detailsTerm: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right"
  },
  detailsText: {
    color: "#CBD5E1",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "right"
  },
  detailsLinkButton: {
    alignSelf: "flex-end",
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.45)",
    backgroundColor: "rgba(56, 189, 248, 0.16)"
  },
  detailsLinkText: {
    color: "#BAE6FD",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  }
});
