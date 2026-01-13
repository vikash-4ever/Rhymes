import icons from "@/constants/icons";
import { usePlayer } from "@/lib/PlayerContext";
import { useAudioPlayerStatus } from "expo-audio";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    stopTrack,
    player,
    isTrackLiked,
    toggleLikeTrack,
    isPreparing,
  } = usePlayer();

  const { currentTime = 0, duration = 0, isBuffering = false } =
    useAudioPlayerStatus(player) || {};

  if (!currentTrack) return null;

  // --- Scrolling text ---
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const title = currentTrack.title || "Unknown Audio";
  const artist = currentTrack.artist || "Unknown Artist";
  const textToScroll = `${title}  •  ${artist}     `;

  useEffect(() => {
    if (textWidth > containerWidth && containerWidth > 0) {
      const scrollDistance = -(textWidth - containerWidth + 10);
      const duration = Math.abs(scrollDistance) * 30;

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scrollAnim, {
            toValue: scrollDistance,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(scrollAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

      loop.start();
      return () => loop.stop();
    } else {
      scrollAnim.setValue(0);
    }
  }, [title, artist, textWidth, containerWidth]);

  // --- PROGRESS BAR ---
  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  const shouldShowLoader = isPreparing || isBuffering;

  return (
    <TouchableOpacity
      className="bg-primary-300 h-14 border-b border-black"
      onPress={() => router.push("/(root)/playingScreen")}
    >
      {/* Progress bar */}
      <View className="h-0.5 w-full bg-primary-100">
        <View
          className="h-0.5 bg-white"
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      <View className="flex-1 flex-row w-full items-center justify-between">
        {/* Like */}
        <TouchableOpacity onPress={() => toggleLikeTrack(currentTrack)}>
          <Image
            source={
              isTrackLiked(currentTrack) ? icons.heartFilled : icons.heart
            }
            tintColor="white"
            className="size-6 mx-4"
          />
        </TouchableOpacity>

        {/* Scrolling text */}
        <View
          className="flex-1 overflow-hidden"
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          <Animated.View
            onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
            style={{ transform: [{ translateX: scrollAnim }] }}
          >
            <Text className="text-white text-sm font-poppins-medium" numberOfLines={1}>
              {textToScroll}
            </Text>
          </Animated.View>
        </View>

        {/* Play / Pause / Loader */}
        <View className="flex-row items-center mr-4">
          <TouchableOpacity disabled={shouldShowLoader} onPress={togglePlayPause}>
            {shouldShowLoader ? (
              <ActivityIndicator size="small" color="white" style={{ marginHorizontal: 12 }} />
            ) : (
              <Image
                source={isPlaying ? icons.pause : icons.play}
                tintColor="white"
                className="size-5 mx-3"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={stopTrack}>
            <Image
              source={icons.next}
              tintColor="white"
              className="size-6 ml-1"
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
