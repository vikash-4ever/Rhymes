import SongOptions from "@/components/SongOptions";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Slider } from "@miblanchard/react-native-slider";
import { useProgress } from "@rntp/player";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

  type LyricLine = {
    time: number;
    text: string;
  }

  const fmt = (sec: number) => {
    if (!sec || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getSliderValue = (v: number | number[]) =>
    Array.isArray(v) ? v[0] : v;

  const parseLrc = (lrc: string): LyricLine[] => {

    const result : LyricLine[] = [];

    for (const line of lrc.split("\n")) {

      const match =
        line.match(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\](.*)/);

      if (!match) continue;

      const minutes = Number(match[1]);
      const seconds = Number(match[2]);
      const milliseconds =
        Number(match[3] || 0);

      const text = match[4].trim();

      if (!text) continue;

      result.push({
        time:
          minutes * 60 +
          seconds +
          milliseconds / 100,
        text,
      });
    }

    return result;
  };

export default function PlayingScreen() {

  const {
    currentTrack,
    pendingTrack,
    dominantColor,
    isPlaying,
    togglePlayPause,
    isPreparing,
    playNext,
    playPrevious,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeatMode,
    seekTo,
    queueContext,
  } = usePlayer();

  const progress = useProgress(0.25);

  const { position: playbackPosition, duration } = progress;
  const displayTrack = pendingTrack ?? currentTrack;
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsLines, setLyricsLines] = useState<LyricLine[]>([]);

  const seekingRef = useRef<number | null>(null);
  
  useEffect(() => {

    const loadLyrics = async () => {

      if (!displayTrack?.lyrics_url) {
        setLyrics(null);
        setLyricsLines([]);
        return;
      }

      try {

        setLyricsLoading(true);

        const response = await fetch(displayTrack.lyrics_url);

        const text = await response.text();

        setLyrics(text);

        const parsed = parseLrc(text);

        setLyricsLines(parsed);

      } catch (error) {
          setLyrics(null);
          setLyricsLines([]);
      } finally {

        setLyricsLoading(false);

      }
    };

    loadLyrics();

  }, [displayTrack]);

  const cleanLyrics = useMemo(() => {
    return lyrics
      ?.replace(/\[[0-9:.]+\]/g, "")
      ?.replace(/\[.*?\]/g, "")
      ?.replace(/^\.+$/gm, "")
      ?.replace(/\r\n/g, "\n")
      ?.replace(/\n\s*\n\s*\n+/g, "\n\n")
      ?.trim();
  }, [lyrics]);

  const {likedSongs, handleToggleLike} = useGlobalContext();

  const isLiked = displayTrack ? likedSongs.includes(displayTrack!.id) : false;
  const [isSliding, setIsSliding] = useState(false);
  const [slideValue, setSlideValue] = useState(0);
  const [showOptions, setShowOptions] = useState(false);

  const handleLikePress = useCallback(async () => {
    if (!displayTrack) return;
    await handleToggleLike(displayTrack.id);
  }, [displayTrack, handleToggleLike]);

  
  const sliderPosition = isSliding ? slideValue : playbackPosition;
  
  const total = useMemo(() => (duration > 0 ? duration : 1),
  [duration]); 
  
  const activeLineIndex = useMemo(() => {
    return lyricsLines.findIndex((line, index) => {
      const nextLine = lyricsLines[index + 1];
      
      if (!nextLine) {
        return sliderPosition >= line.time;
      }
      
      return (
        sliderPosition >= line.time &&
        sliderPosition < nextLine.time
      );
    });
  }, [lyricsLines, sliderPosition]);

  useEffect(() => {
    if (seekingRef.current == null) return;

    if (
      Math.abs(playbackPosition - seekingRef.current) < 0.25
    ) {
      seekingRef.current = null;
      setIsSliding(false);
    }
  }, [playbackPosition]);

  const handleSliderChange = useCallback((v: number | number[]) => {
    setSlideValue(getSliderValue(v));
  }, []);
  
  const onSlideComplete = useCallback(async (v: number | number[]) => {
    const value = getSliderValue(v);
    
    seekingRef.current = value;
    
    setSlideValue(value);

    try {
      await seekTo(value);
    } catch(error) {
      seekingRef.current = null;
      setIsSliding(false);
    }
  }, [seekTo]);
  
  const showLoader = isPreparing;
  const playIcon = isPlaying ? icons.pause : icons.play;
  
  if (!displayTrack) {
    return (
      <View className="flex-1 bg-primary-200 items-center justify-center">
        <Text className="text-white font-poppins-semibold">
          No track selected.
        </Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: dominantColor}}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        
        {/* Header */}
        <View className="flex flex-row items-center justify-between mt-4 px-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.down} tintColor="white" className="size-6 m-4" />
          </TouchableOpacity>

          <View className="items-center gap-1">
            <Text className="text-white text-sm font-poppins-regular">
              Now Playing
            </Text>
            <Text 
              className="text-white text-md font-bold"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {showLoader ? "Loading…" : `from ${queueContext.title}`}
            </Text>
          </View>

          <TouchableOpacity onPress={() => setShowOptions(prev => !prev)}>
            <Image source={icons.option} tintColor="white" className="size-6 m-4" />
          </TouchableOpacity>
        </View>

        <Modal
          visible={showOptions}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOptions(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className="flex-1 bg-[#00000080] justify-end"
            onPress={() => setShowOptions(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
            >
              <SongOptions
                song={displayTrack}
                onClose={() => setShowOptions(false)}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Album Art */}
        <View className="items-center mt-4 px-7">
          <Image
            source={
              displayTrack.thumbnail_url
                ? { uri: displayTrack.thumbnail_url }
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
              {displayTrack.title}
            </Text>
            <Text 
              className="text-[#ffffff66] font-poppins-semibold" 
              numberOfLines={1}
            >
              {displayTrack.artists?.map((a) => a.name).join(", ")}
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
            value={sliderPosition}
            minimumValue={0}
            maximumValue={total}
            minimumTrackTintColor="white"
            maximumTrackTintColor="#ffffff38"
            thumbTintColor="white"
            onSlidingStart={() => setIsSliding(true)}
            onValueChange={handleSliderChange}
            onSlidingComplete={onSlideComplete}
          />

          <View className="flex-row justify-between">
            <Text className="text-white text-xs">{fmt(sliderPosition)}</Text>
            <Text className="text-white text-xs">{fmt(total)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View className="flex-row h-20 w-full justify-between items-center px-7 mt-4">
          <TouchableOpacity onPress={toggleShuffle} className="h-12 w-12 items-center justify-center">
            <Image source={icons.shuffle} tintColor={isShuffle ? "white" : "#ffffff38"} className="w-7 h-7" fadeDuration={0}/>
          </TouchableOpacity>

          <TouchableOpacity onPress={playPrevious} className="h-12 w-12 items-center justify-center">
            <Image source={icons.previous} tintColor="white" className="w-7 h-7" fadeDuration={0}/>
          </TouchableOpacity>

          <TouchableOpacity onPress={togglePlayPause} className="w-20 h-20 bg-white rounded-full items-center justify-center">
            {showLoader ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View>
                <Image source={playIcon} tintColor="black" className="w-6 h-6" fadeDuration={0}/>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={playNext} className="h-12 w-12 items-center justify-center">
            <Image source={icons.next} tintColor="white" className="w-7 h-7" fadeDuration={0}/>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleRepeatMode} className="h-12 w-12 items-center justify-center">
            <View>
              <Image source={icons.repeat} tintColor={repeatMode === "off" ? "#ffffff38" : "white"} className="w-7 h-7" fadeDuration={0}/>
              {repeatMode === "one" && (
                <Text className="absolute text-white font-poppins-bold bg-[#00000000] text-xs self-center mt-1">
                  1
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="flex-1 items-center justify-center mt-12">
          <Image source={icons.soundWave} tintColor="white" className="size-8" />
        </TouchableOpacity>

        <View className="px-7 mt-8 mb-20">

          <Text className="text-white text-2xl font-poppins-semibold mb-4">
            Lyrics
          </Text>

          {lyricsLoading ? (

            <ActivityIndicator color="white" />

          ) : lyricsLines.length > 0 ? (

            lyricsLines.map(
              (line, index) => {

                const isActive =
                  index === activeLineIndex;

                return (

                  <Text
                    key={`${line.time}-${index}`}
                    className={
                      isActive
                        ? "text-white text-xl font-poppins-bold mb-4"
                        : "text-[#ffffff66] text-lg font-poppins-bold mb-4"
                    }
                  >
                    {line.text}
                  </Text>

                );
              }
            )

          ) : cleanLyrics ? (

            <Text
              className="
                text-white/70
                text-xl
                leading-10
                font-poppins-medium
              "
            >
              {cleanLyrics}
            </Text>

          ) : (

            <Text className="text-white/50">
              Lyrics not available
            </Text>

          )}

        </View>
      </ScrollView>
    </View>
  );
}
