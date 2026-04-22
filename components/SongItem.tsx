import icons from "@/constants/icons";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import { Image, Text, TouchableOpacity, View } from "react-native";

type Props = {
  song: Song;
  index: number;
  songs: Song[];
  onOptionsPress?: () => void;
};

export default function SongItem({song, index, songs, onOptionsPress} : Props) {
    const { playQueue, currentTrack } = usePlayer();

    const isPlaying = currentTrack?.id === song.id;
    return(
        <TouchableOpacity
            className="flex-row h-14 w-full justify-between mt-1"
            onPress={async () => {
                await playQueue(songs, index);
            }}
        >
          <View className="h-16 justify-center px-4 mr-14">
            <Text
              className={`text-lg font-poppins-semibold ${
                isPlaying ? "text-white" : "text-gray-500"
              }`}
              numberOfLines={1}
            >
              {song.title}
            </Text>

            <Text
              className="text-sm font-poppins-light text-gray-500"
              numberOfLines={1}
            >
              {song.artists?.map(a => a.name).join(", ")}
            </Text>
          </View>
        <TouchableOpacity
          onPress={onOptionsPress}
          className="absolute right-0 h-16 w-14 items-center justify-center"
        >
        <Image source={icons.option} className="size-5" tintColor="gray" />
      </TouchableOpacity>
    </TouchableOpacity>
    )
}