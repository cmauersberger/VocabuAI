import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function SettingsPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>App preferences and account settings.</Text>
      <Text style={styles.muted}>
        Placeholder: theme, language, and data sync options.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8
  },
  text: {
    fontSize: 16,
    color: "#E5E7EB"
  },
  muted: {
    fontSize: 14,
    color: "#94A3B8"
  }
});
