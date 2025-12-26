import React from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Button from "../../components/Button";
import { getApiBaseUrl } from "../../infrastructure/apiBaseUrl";
import { decodeJwtPayload } from "../../infrastructure/jwt";

type Props = {
  onAuthenticated: (auth: AuthResult) => void;
};

type AuthResult = {
  token: string;
  email: string;
  userName: string;
  issuedAt?: number;
  expiresAt?: number;
};

export default function AuthPage({ onAuthenticated }: Props) {
  const apiBaseUrl = getApiBaseUrl();

  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [userName, setUserName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<Status | null>(null);
  const [isBackendHealthy, setIsBackendHealthy] = React.useState<boolean | null>(
    null
  );

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const normalizeUserName = (value: string) => value.trim();
  const isValidUserName = (value: string) =>
    value.replace(/ /g, "").length >= 3;

  React.useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const checkHealth = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/health`, {
          signal: controller.signal
        });
        setIsBackendHealthy(response.ok);
      } catch {
        setIsBackendHealthy(false);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    checkHealth();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [apiBaseUrl]);

  const handleLogin = async () => {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      setStatus({ text: "Email and password are required.", tone: "error" });
      return;
    }

    setStatus({ text: "Signing in...", tone: "info" });

    try {
      const response = await fetch(`${apiBaseUrl}/auth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password })
      });

      if (!response.ok) {
        setStatus({ text: "Login failed. Check your credentials.", tone: "error" });
        return;
      }

      const payload = (await response.json()) as { accessToken: string };
      const token = payload.accessToken;
      const claims = decodeJwtPayload(token);
      const issuedAt = claims?.iat ? claims.iat * 1000 : undefined;
      const expiresAt = claims?.exp ? claims.exp * 1000 : undefined;
      const claimEmail = claims?.email ?? normalizedEmail;
      const claimUserName = claims?.name ?? normalizedEmail;

      setStatus({ text: "Login successful.", tone: "success" });
      onAuthenticated({
        token,
        email: claimEmail,
        userName: claimUserName,
        issuedAt,
        expiresAt
      });
    } catch (error) {
      setStatus({ text: "Unable to reach the API.", tone: "error" });
    }
  };

  const handleSignup = async () => {
    const normalizedEmail = normalizeEmail(email);
    const normalizedUserName = normalizeUserName(userName);
    if (!normalizedEmail || !password) {
      setStatus({ text: "Email and password are required.", tone: "error" });
      return;
    }
    if (!isValidUserName(normalizedUserName)) {
      setStatus({
        text: "User name must be at least 3 characters (excluding spaces).",
        tone: "error"
      });
      return;
    }

    setStatus({ text: "Creating account...", tone: "info" });

    try {
      const response = await fetch(`${apiBaseUrl}/api/users/CreateUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          userName: normalizedUserName,
          password
        })
      });

      if (!response.ok) {
        const message =
          response.status === 409
            ? "Email already exists."
            : "Could not create user.";
        setStatus({ text: message, tone: "error" });
        return;
      }

      setStatus({ text: "Account created. You can sign in now.", tone: "success" });
      setMode("login");
      setPassword("");
    } catch (error) {
      setStatus({ text: "Unable to reach the API.", tone: "error" });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.titleRow}>
        <Text style={styles.title}>
          {mode === "login" ? "Sign In" : "Create Account"}
        </Text>
        <View
          style={[
            styles.healthDot,
            isBackendHealthy === null
              ? styles.healthUnknown
              : isBackendHealthy
                ? styles.healthOk
                : styles.healthFail
          ]}
        />
      </View>

      <View style={styles.card}>
        {mode === "signup" ? (
          <TextInput
            value={userName}
            onChangeText={setUserName}
            placeholder="User name"
            placeholderTextColor="#64748B"
            style={styles.input}
            autoCapitalize="words"
          />
        ) : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          placeholderTextColor="#64748B"
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor="#64748B"
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />

        {status ? (
          <Text style={[styles.status, styles[`status${status.tone}`]]}>
            {status.text}
          </Text>
        ) : null}

        <Button
          label={mode === "login" ? "Sign In" : "Create User"}
          onClick={mode === "login" ? handleLogin : handleSignup}
        />

        <Text
          style={styles.link}
          onPress={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Create new user" : "Back to login"}
        </Text>
      </View>
    </ScrollView>
  );
}

type Status = {
  text: string;
  tone: "error" | "success" | "info";
};

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    gap: 16
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: "#E5E7EB",
    textAlign: "center"
  },
  titleRow: {
    alignItems: "center",
    gap: 8
  },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    gap: 12
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
  link: {
    marginTop: 4,
    textAlign: "center",
    color: "#A5B4FC"
  },
  healthDot: {
    width: 10,
    height: 10,
    borderRadius: 5
  },
  healthOk: {
    backgroundColor: "#22C55E"
  },
  healthFail: {
    backgroundColor: "#EF4444"
  },
  healthUnknown: {
    backgroundColor: "#94A3B8"
  }
});
