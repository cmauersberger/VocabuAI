import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function LearnPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Study mode goes here.</Text>
      <Text style={styles.muted}>
        Placeholder: spaced repetition session, quizzes, and progress.
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

