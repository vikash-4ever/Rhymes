import icons from "@/constants/icons";
import { QueueContext, usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  song: Song;
  index: number;
  songs: Song[];
  onOptionsPress?: () => void;
  queueContext: QueueContext;
};

export function SongItem({song, index, songs, onOptionsPress, queueContext} : Props) {
    const { playQueue, currentTrack } = usePlayer();

    const isPlaying = currentTrack?.id === song.id;
    return(
        <TouchableOpacity
            className="flex-row h-14 w-full justify-between mt-1"
            onPress={async () => {
                await playQueue(songs, index, queueContext);
            }}
        >
          <View className="h-16 justify-center px-4 mr-14">
            <Text
              className={`text-lg font-poppins-semibold ${
                isPlaying ? "text-white" : "text-['#ffffff72']"
              }`}
              numberOfLines={1}
            >
              {song.title}
            </Text>

            <Text
              className="text-sm font-poppins-light text-['#ffffff44']"
              numberOfLines={1}
            >
              {song.artists?.map(a => a.name).join(", ")}
            </Text>
          </View>
        <TouchableOpacity
          onPress={onOptionsPress}
          className="absolute right-0 h-14 w-14 items-center justify-center"
        >
        <Image source={icons.option} className="size-5" tintColor="white" />
      </TouchableOpacity>
    </TouchableOpacity>
    )
}

export default React.memo(SongItem);