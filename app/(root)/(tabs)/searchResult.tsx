// SearchResult.tsx — FINAL VERSION
import icons from "@/constants/icons";
import images from "@/constants/images";
import { usePlayer } from "@/lib/PlayerContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function SearchResult() {
  const { result } = useLocalSearchParams();
  const song = result ? JSON.parse(result as string) : null;

  const title = song?.title || "Unknown Title";
  const artist = song?.artist || "Unknown Artist";
  const thumbnail = song?.thumbnail || null;
  const originalUrl = song?.url;

  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    playTrack,
    isTrackLiked,
    toggleLikeTrack,
    isPreparing,
  } = usePlayer();

  const isSameSong =
    currentTrack &&
    (currentTrack.originalLink === originalUrl ||
      currentTrack.url === originalUrl);

  const handlePlay = async () => {
    if (!originalUrl) return;

    if (isSameSong) {
      await togglePlayPause();
      return;
    }

    await playTrack({
      title,
      artist,
      thumbnail,
      url: originalUrl,
      originalLink: originalUrl,
    });
  };

  const buttonText = isSameSong
    ? isPlaying
      ? "Pause"
      : "Resume"
    : "Play";

  return (
    <View className="flex-1 bg-black w-full items-center justify-center">
      {/* Top Bar */}
      <View
        style={{ zIndex: 999 }}
        className="absolute left-0 top-0 flex-row w-full justify-between items-center"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={icons.back} tintColor={"white"} className="size-5 m-5" />
        </TouchableOpacity>

        <View className="flex-row items-center justify-center">
          <TouchableOpacity onPress={() => toggleLikeTrack(song)}>
            <Image
              source={isTrackLiked(song) ? icons.heartFilled : icons.heart}
              tintColor={"white"}
              className="size-6 m-5"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main */}
      <View style={{ zIndex: 30 }} className="absolute top-28 items-center">
        <Image
          source={thumbnail ? { uri: thumbnail } : images.image1}
          className="h-44 w-44"
        />

        <Text className="text-white text-2xl font-poppins-semibold mt-4 px-12 text-center" numberOfLines={2}>
          {title}
        </Text>

        <Text className="text-gray-400 text-md font-poppins-medium px-16 text-center">
          {artist}
        </Text>

        <TouchableOpacity
          onPress={handlePlay}
          className="bg-primary-300 px-8 py-4 rounded-full mt-8"
          disabled={isPreparing}
        >
          <Text className="text-white text-lg font-poppins-semibold">
            {buttonText}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Background */}
      <LinearGradient
        colors={["#1c2e4aff", "#000000cc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="absolute top-0 left-0 right-0 h-[360]"
      />
    </View>
  );
}
