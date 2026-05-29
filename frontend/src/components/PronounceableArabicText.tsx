import React from "react";
import {
  Linking,
  Modal,
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
import {
  playPronunciationAudioAsync,
  speakPronunciationFallbackAsync
} from "../infrastructure/pronunciationPlayer";

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

type PronunciationDetails = {
  attributionUrl: string | null;
  creator: string | null;
  credit: string | null;
  licenseShortName: string | null;
  source: string;
  summary: string;
  term: string;
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
  const [details, setDetails] = React.useState<PronunciationDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUnavailable, setIsUnavailable] = React.useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);

  const loadLookupAsync = async () => {
    const nextLookup =
      lookup ??
      (await lookupPronunciationAsync(apiBaseUrl, authToken, term, languageCode));
    setLookup(nextLookup);
    return nextLookup;
  };

  const buildHumanDetails = (
    nextLookup: PronunciationLookupResponseDto
  ): PronunciationDetails => ({
    attributionUrl: nextLookup.attributionUrl,
    creator: nextLookup.creator,
    credit: nextLookup.credit,
    licenseShortName: nextLookup.licenseShortName,
    source: nextLookup.source ?? "wikimedia-commons",
    summary: "Human recording from Wikimedia Commons.",
    term: nextLookup.term
  });

  const buildFallbackDetails = (reason?: string | null): PronunciationDetails => ({
    attributionUrl: null,
    creator: null,
    credit: null,
    licenseShortName: null,
    source: "device-speech",
    summary:
      reason && reason.trim()
        ? `${reason.trim()} Using device/browser speech synthesis instead.`
        : "Using device/browser speech synthesis because no human recording is available.",
    term
  });

  const resolvePlaybackAsync = async () => {
    try {
      const nextLookup = await loadLookupAsync();
      if (nextLookup.isAvailable && nextLookup.audioUrl) {
        const nextDetails = buildHumanDetails(nextLookup);
        setDetails(nextDetails);
        return {
          audioUrl: nextLookup.audioUrl,
          details: nextDetails,
          mode: "human" as const
        };
      }

      const nextDetails = buildFallbackDetails(nextLookup.message);
      setDetails(nextDetails);
      return {
        audioUrl: null,
        details: nextDetails,
        mode: "tts" as const
      };
    } catch {
      const nextDetails = buildFallbackDetails(
        "Pronunciation lookup is temporarily unavailable."
      );
      setDetails(nextDetails);
      return {
        audioUrl: null,
        details: nextDetails,
        mode: "tts" as const
      };
    }
  };

  const loadAndPlay = async () => {
    if (isUnavailable || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const playback = await resolvePlaybackAsync();
      if (playback.mode === "human") {
        await playPronunciationAudioAsync(playback.audioUrl);
      } else {
        await speakPronunciationFallbackAsync(term, languageCode);
      }
    } catch {
      setIsUnavailable(true);
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
      await resolvePlaybackAsync();
      setIsDetailsOpen(true);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const openAttributionLink = async () => {
    const attributionUrl = details?.attributionUrl;
    if (!attributionUrl) {
      return;
    }

    try {
      await Linking.openURL(attributionUrl);
    } catch {
    }
  };

  const buttonUnavailable = isUnavailable;
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
        {details ? (
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
              Info
            </Text>
          </Pressable>
        ) : null}
      </View>
      {details ? (
        <Modal
          visible={isDetailsOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDetailsOpen(false)}
        >
          <View style={styles.modalRoot}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsDetailsOpen(false)}
              style={styles.modalBackdrop}
            />
            <View style={styles.modalCard}>
              <Text style={styles.detailsTerm}>{details.term}</Text>
              <Text style={styles.detailsText}>{details.summary}</Text>
              <Text style={styles.detailsText}>
                Source: {details.source}
              </Text>
              <Text style={styles.detailsText}>
                License: {details.licenseShortName ?? "Not applicable"}
              </Text>
              <Text style={styles.detailsText}>
                Creator: {details.creator ?? "Not applicable"}
              </Text>
              {details.credit ? (
                <Text style={styles.detailsText}>Credit: {details.credit}</Text>
              ) : null}
              <View style={styles.modalActions}>
                {details.attributionUrl ? (
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
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setIsDetailsOpen(false)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed ? styles.buttonPressed : null
                  ]}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.72)"
  },
  modalCard: {
    width: "86%",
    maxWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    backgroundColor: "rgba(15, 23, 42, 0.98)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6
  },
  detailsTerm: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center"
  },
  detailsText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "left"
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 4
  },
  detailsLinkButton: {
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
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
    backgroundColor: "rgba(51, 65, 85, 0.55)"
  },
  closeButtonText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase"
  }
});
