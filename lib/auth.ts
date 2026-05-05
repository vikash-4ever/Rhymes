import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { openAuthSessionAsync } from "expo-web-browser";
import { OAuthProvider } from "react-native-appwrite";
import { account } from "./appwrite"; // Your Appwrite config file

WebBrowser.maybeCompleteAuthSession();
// Function to handle Google OAuth login flow
export async function loginWithGoogle() {
  try {
    const redirectUri = Linking.createURL('/');
    console.log("Redirect URI : ", redirectUri);

    const response = await account.createOAuth2Token(
      OAuthProvider.Google,
      redirectUri
    );

    if (!response) {
      throw new Error("Failed to get OAuth URL");
    }

    const browserResult = await openAuthSessionAsync(
      response.toString(),
      redirectUri
    );

    if (browserResult.type !== 'success') throw new Error('Login failed');

    const url = new URL(browserResult.url);

    const secret = url.searchParams.get('secret')?.toString();
    const userId = url.searchParams.get('userId')?.toString();

    if (!secret || !userId) throw new Error('Missing params');

    const session = await account.createSession(userId, secret);
    if (!session) throw new Error("Session creation failed!");

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export async function logoutUser() {
  await account.deleteSession("current");
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
