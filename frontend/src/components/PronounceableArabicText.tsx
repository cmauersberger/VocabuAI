import React from "react";
import {
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

  const loadAndPlay = async () => {
    if (isUnavailable || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const nextLookup =
        lookup ??
        (await lookupPronunciationAsync(apiBaseUrl, authToken, term, languageCode));
      setLookup(nextLookup);

      if (!nextLookup.isAvailable || !nextLookup.audioUrl) {
        setIsUnavailable(true);
        return;
      }

      await playPronunciationAudioAsync(nextLookup.audioUrl);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const buttonUnavailable = isUnavailable || (lookup !== null && !lookup.isAvailable);
  const label = isLoading ? "..." : buttonUnavailable ? "N/A" : "Play";

  return (
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
  }
});
