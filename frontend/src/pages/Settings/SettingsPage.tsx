import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import Button from "../../components/Button";

export default function SettingsPage() {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE;

  if (!apiBaseUrl) {
    throw new Error("EXPO_PUBLIC_API_BASE is not set.");
  }

  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [loginStatus, setLoginStatus] = React.useState<Status | null>(null);
  const [authToken, setAuthToken] = React.useState<string | null>(null);

  const [signupEmail, setSignupEmail] = React.useState("");
  const [signupPassword, setSignupPassword] = React.useState("");
  const [signupStatus, setSignupStatus] = React.useState<Status | null>(null);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();

  const handleLogin = async () => {
    const email = normalizeEmail(loginEmail);
    if (!email || !loginPassword) {
      setLoginStatus({ text: "Email and password are required.", tone: "error" });
      return;
    }

    setLoginStatus({ text: "Signing in...", tone: "info" });

    try {
      const response = await fetch(`${apiBaseUrl}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginPassword })
      });

      if (!response.ok) {
        setAuthToken(null);
        setLoginStatus({ text: "Login failed. Check your credentials.", tone: "error" });
        return;
      }

      const payload = (await response.json()) as { accessToken: string };
      setAuthToken(payload.accessToken);
      setLoginStatus({ text: "Login successful.", tone: "success" });
    } catch (error) {
      setAuthToken(null);
      setLoginStatus({ text: "Unable to reach the API.", tone: "error" });
    }
  };

  const handleSignup = async () => {
    const email = normalizeEmail(signupEmail);
    if (!email || !signupPassword) {
      setSignupStatus({ text: "Email and password are required.", tone: "error" });
      return;
    }

    setSignupStatus({ text: "Creating account...", tone: "info" });

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/CreateUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: signupPassword })
      });

      if (!response.ok) {
        const message =
          response.status === 409
            ? "Email already exists."
            : "Could not create user.";
        setSignupStatus({ text: message, tone: "error" });
        return;
      }

      setSignupStatus({ text: "Account created.", tone: "success" });
    } catch (error) {
      setSignupStatus({ text: "Unable to reach the API.", tone: "error" });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Account</Text>
      <Text style={styles.muted}>
        API base: {Platform.OS === "web" ? apiBaseUrl : apiBaseUrl}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Login</Text>
        <TextInput
          value={loginEmail}
          onChangeText={setLoginEmail}
          placeholder="you@example.com"
          placeholderTextColor="#64748B"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          value={loginPassword}
          onChangeText={setLoginPassword}
          placeholder="Password"
          placeholderTextColor="#64748B"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />
        {loginStatus ? (
          <Text style={[styles.status, styles[`status${loginStatus.tone}`]]}>
            {loginStatus.text}
          </Text>
        ) : null}
        {authToken ? (
          <Text style={styles.tokenNote}>Token stored in memory.</Text>
        ) : null}
        <Button label="Sign In" onClick={handleLogin} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create Account</Text>
        <TextInput
          value={signupEmail}
          onChangeText={setSignupEmail}
          placeholder="you@example.com"
          placeholderTextColor="#64748B"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          value={signupPassword}
          onChangeText={setSignupPassword}
          placeholder="Password (min 8 chars)"
          placeholderTextColor="#64748B"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />
        {signupStatus ? (
          <Text style={[styles.status, styles[`status${signupStatus.tone}`]]}>
            {signupStatus.text}
          </Text>
        ) : null}
        <Button label="Create User" onClick={handleSignup} />
      </View>
    </ScrollView>
  );
}

type Status = {
  text: string;
  tone: "error" | "success" | "info";
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 20,
    gap: 16
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E5E7EB"
  },
  muted: {
    fontSize: 13,
    color: "#94A3B8"
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    gap: 10
  },
  cardTitle: {
    fontSize: 16,
    color: "#C7D2FE",
    fontWeight: "600"
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    color: "#FFFFFF"
  },
  status: {
    fontSize: 13
  },
  statuserror: {
    color: "#FCA5A5"
  },
  statussuccess: {
    color: "#86EFAC"
  },
  statusinfo: {
    color: "#93C5FD"
  },
  tokenNote: {
    fontSize: 12,
    color: "#A5B4FC"
  }
});
