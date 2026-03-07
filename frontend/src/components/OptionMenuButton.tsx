import React from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Button from "./Button";

export type OptionMenuItem<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type Props<T extends string = string> = {
  label: string;
  options: OptionMenuItem<T>[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onSelect: (value: T) => void;
  disabled?: boolean;
  buttonStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  menuMinWidth?: number;
  menuOffset?: number;
  align?: "left" | "right";
};

export default function OptionMenuButton<T extends string>({
  label,
  options,
  isOpen,
  onToggle,
  onClose,
  onSelect,
  disabled,
  buttonStyle,
  containerStyle,
  menuMinWidth = 218,
  menuOffset = 52,
  align = "left"
}: Props<T>) {
  const hasEnabledOption = options.some((option) => !option.disabled);
  const isButtonDisabled = disabled || !hasEnabledOption;

  const handleOptionSelect = (option: OptionMenuItem<T>) => {
    if (option.disabled) return;
    onClose();
    onSelect(option.value);
  };

  const menuAlignmentStyle =
    align === "left" ? { left: 0 } : { right: 0 };

  return (
    <View style={[styles.anchor, containerStyle]}>
      <Button
        label={label}
        onClick={() => {
          if (isButtonDisabled) return;
          onToggle();
        }}
        style={buttonStyle}
        disabled={isButtonDisabled}
      />
      {isOpen ? (
        <View
          style={[
            styles.menu,
            menuAlignmentStyle,
            { bottom: menuOffset, minWidth: menuMinWidth }
          ]}
        >
          {options.map((option) => (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => handleOptionSelect(option)}
              disabled={option.disabled}
              style={({ pressed }) => [
                styles.option,
                option.disabled ? styles.optionDisabled : null,
                pressed && !option.disabled ? styles.optionPressed : null
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  option.disabled ? styles.optionTextDisabled : null
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "relative",
    zIndex: 2
  },
  menu: {
    position: "absolute",
    zIndex: 3,
    elevation: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    overflow: "hidden"
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12
  },
  optionPressed: {
    backgroundColor: "rgba(148, 163, 184, 0.2)"
  },
  optionDisabled: {
    opacity: 0.55
  },
  optionText: {
    fontSize: 13,
    color: "#E5E7EB"
  },
  optionTextDisabled: {
    color: "#94A3B8"
  }
});
