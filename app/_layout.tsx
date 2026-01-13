import { GlobalProvider, useGlobalContext } from "@/lib/global-provider";
import { PlayerProvider } from "@/lib/PlayerContext";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import "../global.css";

function RootNavigator() {
  const { user, loading } = useGlobalContext();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="(root)" />
      ) : (
        <Stack.Screen name="login/signIn" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Thin': require('../assets/fonts/Poppins-Thin.ttf'),
    'Poppins-Light': require('../assets/fonts/Poppins-Light.ttf'),
    'Poppins-ExtraLight': require('../assets/fonts/Poppins-ExtraLight.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
    'Poppins-Black': require('../assets/fonts/Poppins-Black.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <GlobalProvider>
        <PlayerProvider>
          <StatusBar barStyle="light-content" />
          <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <RootNavigator />
          </SafeAreaView>
        </PlayerProvider>
      </GlobalProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
 safeArea: {
  flex:1,
  backgroundColor: '#212121',
 },
 loading: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#212121'
 }
})