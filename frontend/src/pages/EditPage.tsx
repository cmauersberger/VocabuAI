import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function EditPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Create and manage your flashcards here.</Text>
      <Text style={styles.muted}>
        Placeholder: list, add, edit, and delete flashcards.
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

