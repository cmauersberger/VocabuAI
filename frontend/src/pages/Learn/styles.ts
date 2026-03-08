import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
    position: "relative"
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  status: {
    color: "#93C5FD"
  },
  sessionHeader: {
    gap: 8
  },
  progressTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: 999,
    overflow: "hidden"
  },
  progressFill: {
    backgroundColor: "#22C55E"
  },
  progressRemaining: {
    backgroundColor: "rgba(148, 163, 184, 0.3)"
  },
  abortButton: {
    alignSelf: "flex-end"
  },
  abortText: {
    color: "#93C5FD",
    fontSize: 13
  },
  sessionMeta: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  metaText: {
    color: "#94A3B8"
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  mappingCard: {},
  questionLabel: {
    color: "#94A3B8",
    fontSize: 12,
    textTransform: "uppercase"
  },
  questionText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600"
  },
  questionTextCentered: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.4)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF"
  },
  optionList: {
    gap: 10
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)"
  },
  optionRowSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "rgba(56, 189, 248, 0.15)"
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#94A3B8"
  },
  radioSelected: {
    borderColor: "#38BDF8",
    backgroundColor: "#38BDF8"
  },
  optionText: {
    color: "#E2E8F0",
    fontSize: 17
  },
  mappingColumns: {
    flexDirection: "row",
    gap: 12
  },
  mappingSection: {
    gap: 8
  },
  mappingSectionLabel: {
    fontSize: 11,
    color: "#94A3B8",
    textTransform: "uppercase"
  },
  mappingColumn: {
    flex: 1,
    gap: 10
  },
  mappingItem: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    gap: 4
  },
  mappingItemSelected: {
    borderColor: "#F59E0B"
  },
  mappingText: {
    color: "#FFFFFF",
    fontSize: 18
  },
  mappingEmptyHint: {
    color: "#94A3B8",
    fontSize: 13
  },
  mappingPairedList: {
    gap: 10
  },
  mappingPairedRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(56, 189, 248, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)"
  },
  mappingPairedItem: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.85)"
  },
  mappingUnpairButton: {
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)"
  },
  mappingUnpairText: {
    color: "#38BDF8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  mappingActionBar: {
    paddingTop: 4
  },
  incorrectLabel: {
    color: "#F97316",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  correctAnswerBlock: {
    alignItems: "center",
    gap: 12
  },
  correctAnswerText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center"
  },
  mappingCorrectList: {
    gap: 10,
    width: "100%"
  },
  mappingCorrectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  mappingCorrectItem: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34, 197, 94, 0.15)"
  },
  mappingCorrectLine: {
    height: 2,
    backgroundColor: "#22C55E",
    flex: 1,
    alignSelf: "center"
  },
  feedback: {
    fontSize: 15,
    fontWeight: "600"
  },
  correct: {
    color: "#22C55E"
  },
  incorrect: {
    color: "#F97316"
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.12
  },
  flashCorrect: {
    backgroundColor: "#22C55E"
  },
  flashIncorrect: {
    backgroundColor: "#EF4444"
  },
  resultCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 16,
    gap: 8
  },
  generatedTextCard: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 16
  },
  generatedText: {
    color: "#E2E8F0",
    fontSize: 24,
    lineHeight: 32
  },
  resultItem: {
    color: "#E2E8F0",
    fontSize: 15
  },
  generationError: {
    color: "#F97316"
  },
  centeredButton: {
    alignSelf: "center"
  },
  generationActionsSection: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    padding: 12,
    gap: 10
  },
  generationActionsTitle: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    textAlign: "center"
  },
  generationButtonsGroup: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10
  },
  providerMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 8
  },
  generateProviderMenu: {
    alignSelf: "center",
    zIndex: 9
  },
  providerWarning: {
    color: "#F59E0B",
    textAlign: "center"
  },
  historySecondaryButton: {
    alignSelf: "center",
    backgroundColor: "#334155",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.5)"
  },
  openAiUsageText: {
    color: "#93C5FD",
    textAlign: "center"
  },
  historyOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 56
  },
  historyBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.78)"
  },
  historyPanel: {
    width: "92%",
    maxWidth: 880,
    maxHeight: "88%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    padding: 14,
    gap: 10
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  historyTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700"
  },
  historyCloseButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    backgroundColor: "rgba(148, 163, 184, 0.16)"
  },
  historyCloseButtonText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600"
  },
  historyStatus: {
    color: "#93C5FD",
    fontSize: 13
  },
  historyListContent: {
    gap: 12,
    paddingBottom: 8
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    padding: 12,
    gap: 8
  },
  historyItemMeta: {
    color: "#94A3B8",
    fontSize: 12
  },
  historyLabel: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase"
  },
  historyPromptToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  historyPromptToggleRowPressed: {
    opacity: 0.85
  },
  historyPromptToggleText: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "600"
  },
  historyPrompt: {
    color: "#E2E8F0",
    fontSize: 13,
    lineHeight: 20
  },
  historyText: {
    color: "#F8FAFC",
    fontSize: 20,
    lineHeight: 30
  },
  historyDeleteButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.45)",
    backgroundColor: "rgba(249, 115, 22, 0.18)"
  },
  historyDeleteButtonPressed: {
    opacity: 0.88
  },
  historyDeleteButtonDisabled: {
    opacity: 0.6
  },
  historyDeleteText: {
    color: "#FDBA74",
    fontSize: 12,
    fontWeight: "600"
  },
  correctionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center"
  },
  secondaryButton: {
    backgroundColor: "#334155"
  }
});

export default styles;
