import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export type TabKey = "home" | "edit" | "learn" | "settings";

export type TabItem = {
  key: TabKey;
  label: string;
  icon: string;
};

type Props = {
  title: string;
  activeTab: TabKey;
  tabs: TabItem[];
  onNavigate: (tab: TabKey) => void;
  children: React.ReactNode;
  showBottomNav?: boolean;
};

export default function Layout({
  title,
  activeTab,
  tabs,
  onNavigate,
  children,
  showBottomNav = true
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        <View style={styles.content}>{children}</View>

        {showBottomNav ? (
          <View
            style={[styles.bottomNav, { paddingBottom: insets.bottom }]}
            pointerEvents="auto"
          >
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <Pressable
                  key={tab.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  onPress={() => onNavigate(tab.key)}
                  style={({ pressed }) => [
                    styles.navItem,
                    pressed ? styles.navItemPressed : null
                  ]}
                >
                  <Text
                    style={[styles.navIcon, isActive ? styles.active : null]}
                  >
                    {tab.icon}
                  </Text>
                  <Text
                    style={[styles.navLabel, isActive ? styles.active : null]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0B1220"
  },
  root: {
    flex: 1
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "#0B1220"
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  content: {
    flex: 1
  },
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(148, 163, 184, 0.25)",
    backgroundColor: "#0B1220",
    paddingTop: 6,
    zIndex: 10,
    elevation: 10
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 2
  },
  navItemPressed: {
    opacity: 0.9
  },
  navIcon: {
    fontSize: 18,
    color: "#94A3B8"
  },
  navLabel: {
    fontSize: 12,
    color: "#94A3B8"
  },
  active: {
    color: "#C7D2FE"
  }
});
