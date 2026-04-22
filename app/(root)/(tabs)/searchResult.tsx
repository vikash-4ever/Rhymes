import icons from "@/constants/icons";
import images from "@/constants/images";
import { incrementPlay } from "@/lib/api/musicApis";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function SearchResult() {
  const { result, queue, index } = useLocalSearchParams();
  const song:Song | null = result ? JSON.parse(result as string) : null;
  const songQueue: Song[] = queue ? JSON.parse(queue as string) : null;
  const currentIndex = index ? Number(index): 0;

  const {likedSongs, setLikedSongs, handleToggleLike} =useGlobalContext();
  const {playQueue ,playTrack, togglePlayPause, currentTrack, isPlaying} = usePlayer();
  const title = song?.title || "Unknown Title";
  const artist = song?.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
  const thumbnail = song?.thumbnail_url;

  const isCurrentSong = currentTrack?.id === song?.id;

  const buttonText = !isCurrentSong ? "Play" : isPlaying ? "Pause" : "Resume";

  const isLiked = song ? likedSongs.includes(song.id) : false;

  const handlePress = async () => {
    if(!song) return;
    try {
      if(!isCurrentSong){
        await playQueue(songQueue, currentIndex);
        incrementPlay(song.id);
      }else{
        await togglePlayPause();
      }
    } catch(error) {
      console.warn("Player action failed!", error);
    }
  };

  const handleLikePress = async () => {
    if(!song) return;
    await handleToggleLike(song.id);
  }

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
          <TouchableOpacity onPress={handleLikePress}>
            <Image
              source={isLiked ? icons.heartFilled : icons.heart}
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
          className="bg-gray-400 px-8 py-4 rounded-full mt-8"
          onPress={handlePress}
        >
          <Text className="text-black text-lg font-poppins-semibold">
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
