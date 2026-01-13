import icons from "@/constants/icons";
import images from "@/constants/images";
import { config, databases, ID } from "@/lib/appwrite";
import { loginWithGoogle } from "@/lib/auth";
import { useGlobalContext } from "@/lib/global-provider";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Text, TouchableOpacity, View } from "react-native";
import { Query } from "react-native-appwrite";

const slides = [
  { id: 1, image: images.design1, text: "Play your favourite songs" },
  { id: 2, image: images.design2, text: "Download for free" },
  { id: 3, image: images.design3, text: "Immersive base & audio experience" },
];

export default function SignIN() {
  const [index, setIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const { user } = useGlobalContext();

  useEffect(() =>{
    if(user) {
      router.replace("/(root)/(tabs)")
    }
  },[user]);

  // Slide animation
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(translateX, {
        toValue: -400,
        duration: 500,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        setIndex((prev) => (prev + 1) % slides.length);
        translateX.setValue(400);

        Animated.timing(translateX, {
          toValue: 0,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const currentSlide = slides[index];

  // Google OAuth login
  const handleGoogleLogin = async () => {
    try {
      const loggedInUser = await loginWithGoogle();

      if (loggedInUser) {
        console.log("✅ LoggedIn User:", loggedInUser);
        const existingUsers = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal("email", loggedInUser.email)]
        );

        if (existingUsers.total === 0) {
          await databases.createDocument(
            config.databaseId,
            config.usersCollectionId,
            ID.unique(),
            {
              name: loggedInUser.name || "",
              email: loggedInUser.email,
              profilePic: loggedInUser.prefs?.profilePic || "",
              phone: null,
              likedAudios: [],
              playlists: [],
              preferences: JSON.stringify({}), // Use JSON.stringify for JSON attributes
            }
          );
          console.log("🆕 User profile created in DB");
        } else {
          console.log("ℹ️ User already exists in DB");
        }

        router.replace("/(root)/(tabs)"); // Use replace to prevent going back
      }
    } catch (err) {
      console.error("❌ Google login error:", err);
    }
  };

  return (
    <View className="flex flex-1 h-full">
      <LinearGradient
        colors={["#0f1a2b", "#bdc4d4"]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, width: "100%" }}
      />

      <View className="absolute top-0 left-0 z-10 w-full">
        <View className="flex flex-row m-8">
          <Text className="text-white text-2xl font-poppins-medium">Rhymes</Text>
          <Image source={icons.logo} tintColor={"white"} className="size-3" />
        </View>

        <View className="absolute top-20 left-0 right-0 flex flex-1 justify-center items-center overflow-hidden">
          <Animated.View
            style={{
              transform: [{ translateX }],
              alignItems: "center",
            }}
          >
            <Image source={currentSlide.image} tintColor={"white"} className="size-32 m-16" />
            <Text className="text-2xl text-white font-poppins-light text-center px-8">
              {currentSlide.text}
            </Text>
          </Animated.View>
        </View>

        <View className="mt-[78%] flex-row justify-center items-center">
          {slides.map((_, i) => (
            <Image
              key={i}
              source={icons.dot}
              className={i === index ? "w-3 h-3" : "w-3 h-3 opacity-50"}
              tintColor={i === index ? "white" : "gray"}
              style={{ marginHorizontal: 0 }}
            />
          ))}
        </View>

        <View className="mt-[70%] px-8">
          <TouchableOpacity
            onPress={handleGoogleLogin}
            className="flex-row border border-white rounded-full py-3 px-8 justify-between items-center"
          >
            <Image source={icons.google} tintColor={"white"} className="size-5" />
            <Text className="text-white text-lg font-poppins-semibold mr-8">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/login/loginOptions")}
            className="items-center justify-center mt-8"
          >
            <Text className="text-lg text-white font-poppins-semibold">Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
