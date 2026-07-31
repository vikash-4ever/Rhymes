import { Stack } from "expo-router";

export default function FavouritesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: {backgroundColor: "#000"} }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="localAudio" />
      <Stack.Screen name="listScreen" />
    </Stack>
  );
}