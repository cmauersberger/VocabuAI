import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Button from "../../components/Button";

type Props = {
  email: string | null;
  issuedAt?: number;
  expiresAt?: number;
  onLogout: () => void;
};

export default function SettingsPage({ email, issuedAt, expiresAt, onLogout }: Props) {
  const formatDate = (value?: number) =>
    value ? new Date(value).toLocaleString() : "Unknown";

  const timeRemaining = () => {
    if (!expiresAt) return null;
    const diffMs = expiresAt - Date.now();
    const minutes = Math.round(diffMs / 60000);
    if (minutes <= 0) return "Expired";
    return `${minutes} min remaining`;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Account</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Signed in</Text>
        <Text style={styles.text}>Email: {email ?? "Unknown"}</Text>
        <Text style={styles.muted}>Issued: {formatDate(issuedAt)}</Text>
        <Text style={styles.muted}>Expires: {formatDate(expiresAt)}</Text>
        {timeRemaining() ? (
          <Text style={styles.muted}>Token: {timeRemaining()}</Text>
        ) : null}
        <Button label="Log Out" onClick={onLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  cardTitle: {
    fontSize: 16,
    color: "#C7D2FE",
    fontWeight: "600"
  },
  text: {
    fontSize: 15,
    color: "#E5E7EB"
  }
});
