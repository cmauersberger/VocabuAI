import React from "react";
import { Platform } from "react-native";
import HomePage from "./pages/HomePage";

if (Platform.OS === "web") {
  require("./styles/global.css");
}

export default function App() {
  return <HomePage />;
}
