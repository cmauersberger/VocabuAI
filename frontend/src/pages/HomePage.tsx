import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { logger } from "../infrastructure/logger";

export default function HomePage() {
  const handlePress = () => {
    logger.info("Button pressed (placeholder action).");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>VocabuAI</Text>
        <Text style={styles.subtitle}>Welcome to the Arabic Memo App</Text>

        <View style={styles.spacer} />

        <Button label="Do Something" onClick={handlePress} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1220"
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    gap: 8
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  subtitle: {
    fontSize: 16,
    color: "#C7D2FE"
  },
  spacer: {
    height: 12
  }
});

