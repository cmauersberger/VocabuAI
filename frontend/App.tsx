import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native";

type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen() {
  const onPress = () => {
    console.log("Placeholder action");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>VocabuAI</Text>
        <Text style={styles.subtitle}>Welcome to the Arabic Memo App</Text>
        <View style={styles.spacer} />
        <Button title="Do Something" onPress={onPress} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Home" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
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
    justifyContent: "center"
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "white"
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#C7D2FE"
  },
  spacer: {
    height: 16
  }
});

