import icons from "@/constants/icons";
import images from "@/constants/images";
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
    isTrackLiked,
    toggleLikeTrack,
    isPreparing,
    player,
  } = usePlayer();

  const { currentTime = 0, duration = 0, isBuffering = false } =
    useAudioPlayerStatus(player) || {};

  const [isSliding, setIsSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(0);

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

  return (
    <View className="flex-1 bg-primary-200">
      {/* Header */}
      <View className="flex flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={icons.down} tintColor="white" className="size-6 m-4" />
        </TouchableOpacity>

        <View className="items-center gap-1">
          <Text className="text-white text-sm font-poppins-regular">
            Now Playing
          </Text>
          <Text className="text-white text-md font-bold">
            {showLoader ? "Loading…" : "Playing"}
          </Text>
        </View>

        <TouchableOpacity>
          <Image source={icons.option} tintColor="white" className="size-6 m-4" />
        </TouchableOpacity>
      </View>

      {/* Album Art */}
      <View className="items-center mt-8 px-7">
        <Image
          source={
            currentTrack.thumbnail
              ? { uri: currentTrack.thumbnail }
              : images.image3
          }
          className="w-full h-80"
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
          <Text className="text-gray-400 font-poppins-regular">
            {currentTrack.artist}
          </Text>
        </View>

        <TouchableOpacity onPress={() => toggleLikeTrack(currentTrack)}>
          <Image
            source={
              isTrackLiked(currentTrack) ? icons.heartFilled : icons.heart
            }
            tintColor="white"
            className="size-7 m-2"
          />
        </TouchableOpacity>
      </View>

      {/* Seek Bar */}
      <View className="w-full mt-4 px-7">
        <Slider
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

        <View className="flex-row justify-between mt-1">
          <Text className="text-white text-xs">{fmt(position)}</Text>
          <Text className="text-white text-xs">{fmt(total)}</Text>
        </View>
      </View>

      {/* Controls */}
      <View className="flex-row justify-between items-center px-7 mt-4">
        <TouchableOpacity>
          <Image source={icons.shuffle} tintColor="#ffffff38" className="w-7 h-7" />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image source={icons.previous} tintColor="white" className="w-7 h-7" />
        </TouchableOpacity>

        <View className="w-20 h-20 bg-white rounded-full items-center justify-center">
          {showLoader ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <TouchableOpacity onPress={togglePlayPause}>
              <Image source={playIcon} tintColor="black" className="w-6 h-6" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity>
          <Image source={icons.next} tintColor="white" className="w-7 h-7" />
        </TouchableOpacity>

        <TouchableOpacity>
          <Image source={icons.repeat} tintColor="#ffffff38" className="w-7 h-7" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center">
        <Image source={icons.soundWave} tintColor="white" className="size-8" />
      </View>
    </View>
  );
}
