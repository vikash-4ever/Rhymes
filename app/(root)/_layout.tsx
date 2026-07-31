import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_bottom",
        contentStyle: { backgroundColor: "#000" },
      }}
    >
      <Stack.Screen name="(tabs)" />

      <Stack.Screen name="playingScreen" />
      <Stack.Screen name="settingsScreen" />
    </Stack>
  );
}