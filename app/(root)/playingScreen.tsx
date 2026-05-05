import icons from "@/constants/icons";
import images from "@/constants/images";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Slider } from "@miblanchard/react-native-slider";
import { useAudioPlayerStatus } from "expo-audio";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const fmt = (sec: number) => {
  if (!sec || sec < 0) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export default function PlayingScreen() {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    isPreparing,
    player,
    playNext,
    playPrevious,
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode
  } = usePlayer();

  const {likedSongs, setLikedSongs, handleToggleLike} = useGlobalContext();

  const { currentTime = 0, duration = 0, isBuffering = false } =
    useAudioPlayerStatus(player) || {};

  const isLiked = currentTrack ? likedSongs.includes(currentTrack!.id) : false;
  const [isSliding, setIsSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(0);

  const [showOptions, setShowOptions] = useState(false);

  const handleLikePress = async () => {
    if (!currentTrack) return;
    const alreadyLiked = likedSongs.includes(currentTrack.id);
    await handleToggleLike(currentTrack.id);
  }

  if (!currentTrack) {
    return (
      <View className="flex-1 bg-primary-200 items-center justify-center">
        <Text className="text-white font-poppins-semibold">
          No track selected.
        </Text>
      </View>
    );
  }

  const position = isSliding ? slideValue : currentTime;
  const total = duration > 0 ? duration : 1;

  const onSlideComplete = async (v: number | number[]) => {
    setIsSliding(false);
    const value = Array.isArray(v) ? v[0] : v;

    try {
      await player.seekTo(value);
    } catch (err) {}
  };

  const showLoader = isPreparing || isBuffering;
  const playIcon = isPlaying ? icons.pause : icons.play;
  const toggleRepeat = () => {
    setRepeatMode(prev => 
      prev === "off" ? "one" : prev === "one" ? "all" : "off"
    );
  };

  return (
    <View className="flex-1 bg-primary-200">
      {/* Header */}
      <View className="flex flex-row items-center justify-between mt-4 px-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={icons.down} tintColor="white" className="size-6 m-4" />
        </TouchableOpacity>

        <View className="items-center gap-1">
          <Text className="text-white text-sm font-poppins-regular">
            Now Playing
          </Text>
          <Text className="text-white text-md font-bold">
            {showLoader ? "Loading…" : "From search"}
          </Text>
        </View>

        <TouchableOpacity onPress={() => setShowOptions(prev => !prev)}>
          <Image source={icons.option} tintColor="white" className="size-6 m-4" />
        </TouchableOpacity>
      </View>

      {showOptions && (
        <View className="absolute inset-0 z-50">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setShowOptions(false)}
          />

          <View className="absolute top-16 right-4 bg-[#000000cc] rounded-xl p-4 w-auto shadow-lg elevation-10">
            <TouchableOpacity className="py-2">
              <Text className="text-white font-poppins-medium">Add to Playlist</Text>
            </TouchableOpacity>

            <TouchableOpacity className="py-2">
              <Text className="text-white font-poppins-medium">Share</Text>
            </TouchableOpacity>

            <TouchableOpacity className="py-2">
              <Text className="text-white font-poppins-medium">Go to Artist</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Album Art */}
      <View className="items-center mt-4 px-7">
        <Image
          source={
            currentTrack.thumbnail_url
              ? { uri: currentTrack.thumbnail_url }
              : images.image3
          }
          className="w-full h-96"
          resizeMode="contain"
        />
      </View>

      {/* Title + Artist */}
      <View className="flex-row items-center justify-between mt-14 px-7">
        <View className="flex-1 mr-2 gap-2">
          <Text
            className="text-white text-2xl font-poppins-semibold"
            numberOfLines={1}
          >
            {currentTrack.title}
          </Text>
          <Text 
            className="text-gray-400 font-poppins-regular" 
            numberOfLines={1}
          >
            {currentTrack.artists?.map((a) => a.name).join(", ")}
          </Text>
        </View>

        <TouchableOpacity 
          className="mt-4"
          onPress={handleLikePress}
        >
          <Image
            source={ isLiked ? icons.heartFilled : icons.heart }
            tintColor="white"
            className="size-7 mx-2 mt-4"
          />
        </TouchableOpacity>
      </View>

      {/* Seek Bar */}
      <View className="w-full mt-4 px-7">
        <Slider
          trackStyle ={{height: 6}}
          value={position}
          minimumValue={0}
          maximumValue={total}
          minimumTrackTintColor="white"
          maximumTrackTintColor="#ffffff38"
          thumbTintColor="white"
          onSlidingStart={() => setIsSliding(true)}
          onValueChange={(v) => {
            const val = Array.isArray(v) ? v[0] : v;
            setSlideValue(val);
          }}
          onSlidingComplete={onSlideComplete}
        />

        <View className="flex-row justify-between">
          <Text className="text-white text-xs">{fmt(position)}</Text>
          <Text className="text-white text-xs">{fmt(total)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View className="flex-row h-20 w-full justify-between items-center px-7 mt-4">
        <TouchableOpacity onPress={() => setIsShuffle(prev => !prev)} className="h-12 w-12 items-center justify-center">
          <Image source={icons.shuffle} tintColor={isShuffle ? "white" : "#ffffff38"} className="w-7 h-7" />
        </TouchableOpacity>

        <TouchableOpacity onPress={playPrevious} className="h-12 w-12 items-center justify-center">
          <Image source={icons.previous} tintColor="white" className="w-7 h-7" />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlayPause} className="w-20 h-20 bg-white rounded-full items-center justify-center">
          {showLoader ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <View>
              <Image source={playIcon} tintColor="black" className="w-6 h-6" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={playNext} className="h-12 w-12 items-center justify-center">
          <Image source={icons.next} tintColor="white" className="w-7 h-7" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleRepeat} className="h-12 w-12 items-center justify-center">
          <View>
            <Image source={icons.repeat} tintColor={repeatMode === "off" ? "#ffffff38" : "white"} className="w-7 h-7" />
            {repeatMode === "one" && (
              <Text className="absolute text-white font-poppins-bold bg-black text-xs bottom-0 right-0">
                1
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center">
        <Image source={icons.soundWave} tintColor="white" className="size-8" />
      </View>
    </View>
  );
}
