import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type Props = {
  label: string;
  onClick: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

export default function Button({ label, onClick, style, disabled }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onClick}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style
      ]}
    >
      <Text style={[styles.label, disabled ? styles.labelDisabled : null]}>
        {label}
      </Text>
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
  },
  disabled: {
    backgroundColor: "#1F2937"
  },
  labelDisabled: {
    color: "#94A3B8"
  }
});
