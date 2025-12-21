import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import { logger } from "../infrastructure/logger";

export default function HomePage() {
  const handlePress = () => {
    logger.info("Button pressed (placeholder action).");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Welcome to the Arabic Memo App</Text>
      <View style={styles.spacer} />
      <Button label="Do Something" onClick={handlePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8
  },
  subtitle: {
    fontSize: 16,
    color: "#C7D2FE"
  },
  spacer: {
    height: 12
  }
});
