import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
  label: string;
  onClick: () => void;
  style?: ViewStyle;
};

export default function Button({ label, onClick, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onClick}
      style={({ pressed }) => [
        styles.base,
        pressed ? styles.pressed : null,
        style
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#4F46E5"
  },
  pressed: {
    opacity: 0.9
  },
  label: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  }
});

