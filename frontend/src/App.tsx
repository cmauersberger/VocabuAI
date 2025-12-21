import React from "react";
import { Platform } from "react-native";
import Layout, { TabItem, TabKey } from "./components/Layout";
import EditPage from "./pages/EditPage";
import HomePage from "./pages/HomePage";
import LearnPage from "./pages/LearnPage";
import SettingsPage from "./pages/SettingsPage";

if (Platform.OS === "web") {
  require("./styles/global.css");
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("home");

  const tabs: TabItem[] = [
    { key: "home", label: "Home", icon: "⌂" },
    { key: "edit", label: "Edit", icon: "✎" },
    { key: "learn", label: "Learn", icon: "▦" },
    { key: "settings", label: "Settings", icon: "⚙" }
  ];

  const titleByTab: Record<TabKey, string> = {
    home: "Home",
    edit: "Edit",
    learn: "Learn",
    settings: "Settings"
  };

  const pageByTab: Record<TabKey, React.ReactNode> = {
    home: <HomePage />,
    edit: <EditPage />,
    learn: <LearnPage />,
    settings: <SettingsPage />
  };

  return (
    <Layout
      title={titleByTab[activeTab]}
      activeTab={activeTab}
      tabs={tabs}
      onNavigate={setActiveTab}
    >
      {pageByTab[activeTab]}
    </Layout>
  );
}
