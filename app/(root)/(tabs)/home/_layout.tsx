import { Stack } from "expo-router";

export default function SearchLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_bottom", contentStyle: {backgroundColor: "#000"} }}>
      <Stack.Screen name="listScreen" />
    </Stack>
  );
}