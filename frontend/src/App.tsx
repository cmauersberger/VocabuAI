import React from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Layout, { TabItem, TabKey } from "./components/Layout";
import AuthPage from "./pages/Auth/AuthPage";
import EditPage from "./pages/Edit/EditPage";
import HomePage from "./pages/Home/HomePage";
import LearnPage from "./pages/Learn/LearnPage";
import SettingsPage from "./pages/Settings/SettingsPage";

if (Platform.OS === "web") {
  require("./styles/global.css");
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState<TabKey>("home");
  const [isLearningSessionActive, setIsLearningSessionActive] =
    React.useState(false);
  const [auth, setAuth] = React.useState<AuthState>({
    token: null,
    email: null,
    userName: null,
    issuedAt: undefined,
    expiresAt: undefined
  });

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

  const handleAuthenticated = React.useCallback((result: AuthState) => {
    setAuth(result);
    setActiveTab("home");
  }, []);

  const handleLogout = React.useCallback(() => {
    setAuth({
      token: null,
      email: null,
      userName: null,
      issuedAt: undefined,
      expiresAt: undefined
    });
    setIsLearningSessionActive(false);
    setActiveTab("home");
  }, []);

  React.useEffect(() => {
    if (!auth.token || !auth.expiresAt) return;
    const remainingMs = auth.expiresAt - Date.now();
    if (remainingMs <= 0) {
      handleLogout();
      return;
    }
    const timeoutId = setTimeout(() => {
      handleLogout();
    }, remainingMs);

    return () => clearTimeout(timeoutId);
  }, [auth.expiresAt, auth.token, handleLogout]);

  const pageByTab: Record<TabKey, React.ReactNode> = {
    home: <HomePage userName={auth.userName} />,
    edit: (
      <EditPage authToken={auth.token as string} onAuthFailure={handleLogout} />
    ),
    learn: (
      <LearnPage
        authToken={auth.token as string}
        onAuthFailure={handleLogout}
        onSessionActiveChange={setIsLearningSessionActive}
        onExitToOverview={() => setActiveTab("home")}
      />
    ),
    settings: (
      <SettingsPage
        email={auth.email}
        userName={auth.userName}
        authToken={auth.token as string}
        issuedAt={auth.issuedAt}
        expiresAt={auth.expiresAt}
        onAuthFailure={handleLogout}
        onLogout={handleLogout}
      />
    )
  };

  return (
    <SafeAreaProvider>
      {auth.token ? (
        <Layout
          title={titleByTab[activeTab]}
          activeTab={activeTab}
          tabs={tabs}
          onNavigate={setActiveTab}
          showBottomNav={!isLearningSessionActive}
        >
          {pageByTab[activeTab]}
        </Layout>
      ) : (
        <AuthPage onAuthenticated={handleAuthenticated} />
      )}
    </SafeAreaProvider>
  );
}

type AuthState = {
  token: string | null;
  email: string | null;
  userName: string | null;
  issuedAt?: number;
  expiresAt?: number;
};
