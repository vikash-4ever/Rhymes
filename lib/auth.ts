// lib/auth.ts
import * as AuthSession from "expo-auth-session";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { OAuthProvider } from "react-native-appwrite";
import { account } from "./appwrite"; // Your Appwrite config file

WebBrowser.maybeCompleteAuthSession();

// Function to handle Google OAuth login flow
export async function loginWithGoogle() {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME,
    });

    // 1. Get the Appwrite OAuth URL
    const oauthUrl = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri,
      redirectUri
    );

    if (!oauthUrl) {
      throw new Error("Failed to get OAuth URL from Appwrite.");
    }

    // 2. Open the browser for the authentication session
    const authResult = await WebBrowser.openAuthSessionAsync(
      oauthUrl.toString(),
      redirectUri
    );

    // 3. Handle the result after the user returns to the app
    if (authResult.type === "success") {
      const url = new URL(authResult.url);
      const params = new URLSearchParams(url.search);

      const secret = params.get("secret");
      const userId = params.get("userId");

      if (!secret || !userId) {
        throw new Error("Missing secret or userId from OAuth redirect.");
      }

      // 4. Create an Appwrite session using the returned token
      await account.createSession(userId, secret);

      console.log("✅ OAuth login successful, session created.");
      return await account.get(); // Fetch and return the user details from Appwrite Auth
    } else if (authResult.type === "dismiss") {
      console.log("➡️ User dismissed the browser during login.");
      return null;
    }
  } catch (error) {
    console.error("❌ Google login failed:", error);
    throw error;
  }
}

export async function logoutUser() {
  await account.deleteSession("current");
  router.push("/login/signIn")
  console.log("🚪 User logged out.");
}

export async function getLoggedInUser() {
  try {
    return await account.get();
  } catch (error) {
    console.log("➡️ No active session found.");
    return null;
  }
}
