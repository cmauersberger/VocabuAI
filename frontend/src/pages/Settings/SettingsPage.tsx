import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../../components/Button";
import type { UserSettingsDto } from "../../domain/dtos/UserSettingsDto";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import { LANGUAGE_OPTIONS } from "./languageOptions";

type Props = {
  email: string | null;
  userName: string | null;
  authToken: string;
  issuedAt?: number;
  expiresAt?: number;
  onLogout: () => void;
};

export default function SettingsPage({
  email,
  userName,
  authToken,
  issuedAt,
  expiresAt,
  onLogout
}: Props) {
  const apiBaseUrl = getApiBaseUrl();
  const [settings, setSettings] = React.useState<UserSettingsDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);
  const [sampleStatus, setSampleStatus] = React.useState<string | null>(null);
  const [isSeedingSamples, setIsSeedingSamples] = React.useState<
    null | "en" | "fr"
  >(null);
  const [activeMenu, setActiveMenu] = React.useState<"foreign" | "local" | null>(
    null
  );

  const formatDate = (value?: number) =>
    value ? new Date(value).toLocaleString() : "Unknown";

  const timeRemaining = () => {
    if (!expiresAt) return null;
    const diffMs = expiresAt - Date.now();
    const minutes = Math.round(diffMs / 60000);
    if (minutes <= 0) return "Expired";
    return `${minutes} min remaining`;
  };

  const loadSettings = React.useCallback(async () => {
    setIsLoading(true);
    setStatus("Loading user settings...");
    try {
      const response = await fetch(`${apiBaseUrl}/users/settings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (!response.ok) {
        setStatus("Unable to load user settings.");
        return;
      }

      const payload = (await response.json()) as UserSettingsDto;
      setSettings(payload);
      setStatus(null);
    } catch (error) {
      setStatus("Unable to reach the API.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl, authToken]);

  React.useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const getLanguageLabel = (code: string | null | undefined) => {
    if (!code) return "Select language";
    const match = LANGUAGE_OPTIONS.find((option) => option.code === code);
    return match ? `${match.label} (${match.code})` : code;
  };

  const updateSetting = (key: keyof UserSettingsDto, value: string) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    setStatus("Saving user settings...");
    try {
      const response = await fetch(`${apiBaseUrl}/users/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        setStatus("Unable to save user settings.");
        return;
      }

      const payload = (await response.json()) as UserSettingsDto;
      setSettings(payload);
      setStatus("User settings saved.");
      setActiveMenu(null);
    } catch (error) {
      setStatus("Unable to reach the API.");
    } finally {
      setIsSaving(false);
    }
  };

  const createSampleCards = async (target: "en" | "fr") => {
    setIsSeedingSamples(target);
    setSampleStatus(`Creating sample flashcards DE->${target.toUpperCase()}...`);
    try {
      const endpoint = target === "en" ? "de-to-en" : "de-to-fr";
      const response = await fetch(
        `${apiBaseUrl}/flashcards/samples/${endpoint}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (!response.ok) {
        setSampleStatus("Unable to create sample flashcards.");
        return;
      }

      setSampleStatus("Sample flashcards created.");
    } catch (error) {
      setSampleStatus("Unable to reach the API.");
    } finally {
      setIsSeedingSamples(null);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.heading}>Account</Text>

      <View style={[styles.card, styles.settingsCard]}>
        <Text style={styles.cardTitle}>Signed in</Text>
        <Text style={styles.text}>Email: {email ?? "Unknown"}</Text>
        <Text style={styles.text}>User name: {userName ?? "Unknown"}</Text>
        <Text style={styles.muted}>Issued: {formatDate(issuedAt)}</Text>
        <Text style={styles.muted}>Expires: {formatDate(expiresAt)}</Text>
        {timeRemaining() ? (
          <Text style={styles.muted}>Token: {timeRemaining()}</Text>
        ) : null}
        <Button label="Log Out" onClick={onLogout} />
      </View>

      <Text style={styles.heading}>User Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Flashcard defaults</Text>
        <Text style={styles.explanation}>
          These languages are used for new flashcards you create.
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.label}>Default Foreign Flashcard Language</Text>
          <View style={styles.selectContainer}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setActiveMenu((prev) => (prev === "foreign" ? null : "foreign"))
              }
              style={({ pressed }) => [
                styles.selectButton,
                pressed ? styles.selectButtonPressed : null,
                isLoading ? styles.selectButtonDisabled : null
              ]}
              disabled={isLoading || !settings}
            >
              <Text style={styles.selectButtonText}>
                {getLanguageLabel(settings?.defaultForeignFlashCardLanguage)}
              </Text>
            </Pressable>
            {activeMenu === "foreign" ? (
              <ScrollView
                style={styles.selectMenu}
                contentContainerStyle={styles.selectMenuContent}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    key={option.code}
                    onPress={() => {
                      updateSetting(
                        "defaultForeignFlashCardLanguage",
                        option.code
                      );
                      setActiveMenu(null);
                    }}
                    style={styles.selectOption}
                  >
                    <Text style={styles.selectOptionText}>{option.label}</Text>
                    <Text style={styles.selectOptionCode}>{option.code}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.label}>Default Local Flashcard Language</Text>
          <View style={styles.selectContainer}>
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                setActiveMenu((prev) => (prev === "local" ? null : "local"))
              }
              style={({ pressed }) => [
                styles.selectButton,
                pressed ? styles.selectButtonPressed : null,
                isLoading ? styles.selectButtonDisabled : null
              ]}
              disabled={isLoading || !settings}
            >
              <Text style={styles.selectButtonText}>
                {getLanguageLabel(settings?.defaultLocalFlashCardLanguage)}
              </Text>
            </Pressable>
            {activeMenu === "local" ? (
              <ScrollView
                style={styles.selectMenu}
                contentContainerStyle={styles.selectMenuContent}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <Pressable
                    accessibilityRole="button"
                    key={option.code}
                    onPress={() => {
                      updateSetting(
                        "defaultLocalFlashCardLanguage",
                        option.code
                      );
                      setActiveMenu(null);
                    }}
                    style={styles.selectOption}
                  >
                    <Text style={styles.selectOptionText}>{option.label}</Text>
                    <Text style={styles.selectOptionCode}>{option.code}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}
          </View>
        </View>

        {status ? <Text style={styles.status}>{status}</Text> : null}

        <Button
          label={isSaving ? "Saving..." : "Save Settings"}
          onClick={saveSettings}
          disabled={isSaving || isLoading || !settings}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add sample content</Text>
        {sampleStatus ? <Text style={styles.status}>{sampleStatus}</Text> : null}
        <View style={styles.sampleButtons}>
          <Button
            label={
              isSeedingSamples === "en"
                ? "Creating sample flashcards..."
                : "Create 30 sample vocabulary flashcards DE->EN"
            }
            onClick={() => createSampleCards("en")}
            style={styles.emptyButton}
            disabled={isSeedingSamples !== null}
          />
          <Button
            label={
              isSeedingSamples === "fr"
                ? "Creating sample flashcards..."
                : "Create 30 sample vocabulary flashcards DE->FR"
            }
            onClick={() => createSampleCards("fr")}
            style={styles.emptyButton}
            disabled={isSeedingSamples !== null}
          />
        </View>
      </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    position: "relative"
  },
  container: {
    flex: 1
  },
  content: {
    padding: 20,
    gap: 16
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E5E7EB"
  },
  muted: {
    fontSize: 13,
    color: "#94A3B8"
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    gap: 10
  },
  settingsCard: {
    position: "relative"
  },
  cardTitle: {
    fontSize: 16,
    color: "#C7D2FE",
    fontWeight: "600"
  },
  explanation: {
    fontSize: 13,
    color: "#94A3B8"
  },
  label: {
    fontSize: 13,
    color: "#CBD5F5"
  },
  text: {
    fontSize: 15,
    color: "#E5E7EB"
  },
  settingRow: {
    gap: 8
  },
  selectContainer: {
    position: "relative"
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.6)"
  },
  selectButtonPressed: {
    opacity: 0.9
  },
  selectButtonDisabled: {
    opacity: 0.6
  },
  selectButtonText: {
    fontSize: 14,
    color: "#E5E7EB"
  },
  selectMenu: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "#0F172A",
    maxHeight: 260
  },
  selectMenuContent: {
    paddingVertical: 6
  },
  selectOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  selectOptionText: {
    fontSize: 14,
    color: "#E5E7EB"
  },
  selectOptionCode: {
    fontSize: 12,
    color: "#94A3B8"
  },
  status: {
    color: "#93C5FD",
    fontSize: 13
  },
  sampleButtons: {
    gap: 10
  },
  emptyButton: {
    alignSelf: "center"
  },
});
