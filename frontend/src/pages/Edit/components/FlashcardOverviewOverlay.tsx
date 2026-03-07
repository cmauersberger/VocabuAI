import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

type Props = {
  isVisible: boolean;
  overviewText: string;
  onClose: () => void;
};

export default function FlashcardOverviewOverlay({
  isVisible,
  overviewText,
  onClose
}: Props) {
  const [copyMessage, setCopyMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isVisible) {
      setCopyMessage(null);
    }
  }, [isVisible]);

  const handleCopy = React.useCallback(async () => {
    if (
      Platform.OS !== "web" ||
      typeof navigator === "undefined" ||
      !navigator.clipboard?.writeText
    ) {
      setCopyMessage(
        "Copy is unavailable on this platform. Select text manually to copy."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(overviewText);
      setCopyMessage("Copied overview to clipboard.");
    } catch (error) {
      setCopyMessage("Unable to copy overview right now.");
    }
  }, [overviewText]);

  if (!isVisible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      />
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>Flashcard overview</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null
            ]}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
        <Text style={styles.description}>
          Monospace plain text, ready to copy and paste.
        </Text>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text selectable style={styles.overviewText}>
            {overviewText}
          </Text>
        </ScrollView>
        {copyMessage ? <Text style={styles.copyMessage}>{copyMessage}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={handleCopy}
            style={({ pressed }) => [
              styles.copyButton,
              pressed ? styles.copyButtonPressed : null
            ]}
          >
            <Text style={styles.copyButtonText}>Copy</Text>
          </Pressable>
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
    zIndex: 56
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.74)"
  },
  panel: {
    width: "92%",
    maxWidth: 760,
    maxHeight: "86%",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    gap: 10
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F8FAFC"
  },
  closeButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(148, 163, 184, 0.16)"
  },
  closeButtonPressed: {
    opacity: 0.9
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E2E8F0"
  },
  description: {
    fontSize: 12,
    color: "#94A3B8"
  },
  contentContainer: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    backgroundColor: "rgba(15, 23, 42, 0.65)"
  },
  overviewText: {
    color: "#E2E8F0",
    fontSize: 12,
    lineHeight: 18,
    writingDirection: "ltr",
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "monospace"
    })
  },
  copyMessage: {
    fontSize: 12,
    color: "#93C5FD"
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end"
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(199, 210, 254, 0.2)"
  },
  copyButtonPressed: {
    opacity: 0.9
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#F8FAFC"
  }
});
