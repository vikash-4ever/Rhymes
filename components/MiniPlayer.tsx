import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { useProgress } from "@rntp/player";
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
    playNext,
    isPreparing,
  } = usePlayer();

  const {position, duration} = useProgress(0.25);
  

  if (!currentTrack) return null;

  // --- Scrolling text ---
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  const title = currentTrack.title || "Unknown Audio";
  const artist = currentTrack.artists?.map((a) => a.name).join(", ") || "Unknown Artist";
  const textToScroll = `${title}  •  ${artist}`;

  const {likedSongs, handleToggleLike} = useGlobalContext();

  const isLiked = currentTrack ? likedSongs.includes(currentTrack.id) : false;

  const handleLikePress = async () => {
    if(!currentTrack) return;

    await handleToggleLike(currentTrack.id);
  };

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
  const safeDuration = duration > 0 ? duration : 1;

  const progressPercentage = Math.min(
    100,
    Math.max(0, (position / safeDuration) * 100)
  );

  const shouldShowLoader = isPreparing;

  return (
    <TouchableOpacity
      className="bg-primary-300 h-14 border-b border-black"
      onPress={() => router.push("/(root)/playingScreen")}
      activeOpacity={0.8}
    >
      {/* Progress bar */}
      <View className="h-0.5 w-full bg-primary-100">
        <View
          className="h-0.5 bg-white"
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      <View className="flex-1 flex-row h-14 w-full items-center justify-between">
        {/* Like */}
        <TouchableOpacity 
          className="h-14 items-center justify-center"
          onPress={handleLikePress}
        >
          <Image
            source={ isLiked ? icons.heartFilled :icons.heart }
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
        <View className="flex-row items-center justify-between">
          <TouchableOpacity disabled={shouldShowLoader} onPress={togglePlayPause} className="h-14 w-12 pl-2 items-center justify-center">
            {shouldShowLoader ? (
              <ActivityIndicator size="small" color="white" style={{ marginHorizontal: 12 }} />
            ) : (
              <Image
                source={isPlaying ? icons.pause : icons.play}
                tintColor="white"
                className="size-5"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} className="h-14 w-12 pr-2 items-center justify-center">
            <Image
              source={icons.next}
              tintColor="white"
              className="size-6"
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
