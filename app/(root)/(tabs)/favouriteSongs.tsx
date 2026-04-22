import SongItem from "@/components/SongItem";
import icons from "@/constants/icons";
import { getSongsByArtist, getSongsByIds } from "@/lib/api/musicApis";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Text, TouchableOpacity, View } from "react-native";

export default function FavouriteSongs(){

    const {playQueue} = usePlayer();
    const {type, id, title, artist} = useLocalSearchParams();
    const {likedSongs, playlists} = useGlobalContext();
    const [songs, setSongs] = useState<Song[]>([]);
    const [songsLoading, setSongsLoading] = useState(false);
    const prevIdsRef = useRef<string[]>([]);
    const scrollY = useState(new Animated.Value(0))[0];

    let sourceIds: string[] = [];
    let isArtist = false;

    if (type === "liked") {
        sourceIds = likedSongs;
    }
    else if (type === "playlist") {
        const playlist = playlists.find(p => p.$id === id);
        sourceIds = playlist?.songIds || [];
    }
    else if (type === "artist") {
        isArtist = true;
    }

    const textTranslateY = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, -230],
        extrapolate: "clamp",
    });

    const scrollTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [8, 48],
        extrapolate: "clamp",
    });

    const imageOpacity = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    useEffect(() => {

        const loadSongs = async () => {
            setSongsLoading(true);

            try {
                if( type === "artist") {
                    const res = await getSongsByArtist(artist as string);

                    const artistSongs = Array.isArray(res)
                        ? res
                        : res?.results || [];

                    setSongs(artistSongs);
                    return;
                }

                if (!sourceIds || sourceIds.length === 0) {
                    setSongs([]);
                    return;
                }

                const res = await getSongsByIds(sourceIds);
                    
                if(!Array.isArray(res)) return;

                const songMap = new Map(res.map((s: Song) => [s.id, s]));
                const orderedSongs = sourceIds.map(id => songMap.get(id)).filter((s) : s is Song => Boolean(s));
                setSongs(orderedSongs);
            } catch (error) {
                console.log("Liked fetch error : ", error);
            } finally {
                setSongsLoading(false);
            }
        };
        loadSongs();
    }, [type, id, artist, playlists, likedSongs]);


    return(
        <View className="flex-1 bg-black">
            <LinearGradient
                colors={["#5753a0", "#000000"]}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.1, y: 0.7 }}
                className="absolute inset-0"
            />
            <TouchableOpacity onPress={router.back} className="absolute z-10 top-0 left-0 h-14 w-14 items-center justify-center">
                <Image source={icons.back} className="size-6" tintColor={"white"}/>
            </TouchableOpacity>

            <Animated.View
                style={{
                    position:"absolute",
                    top: 18,
                    alignSelf: "center",
                    opacity: imageOpacity,
                }}
            >
                <View className="h-48 w-48 mt-12 items-center justify-center">
                    <LinearGradient
                        colors={["#bdc4d4", "#3f3a9b"]}
                        start={{ x: 0.1, y: 0.1 }}
                        end={{ x: 1, y: 1 }}
                        style={{ flex: 1, width: "100%" }}
                    />
                    <Image source={icons.heartFilled} tintColor={"white"} className="absolute size-16"/>
                </View>
            </Animated.View>

            <Animated.Text
                style= {{
                    position: "absolute",
                    top: "34%",
                    alignSelf: "center",
                    transform:[{translateY: textTranslateY}]
                }}
                className="font-poppins-bold text-xl text-white" numberOfLines={2}>
                    {title || "Songs"}
            </Animated.Text>

            <Animated.View
                style= {{
                    position: "absolute",
                    top: "36%",
                    alignSelf: "center",
                    opacity: imageOpacity,
                    transform: [{translateY: textTranslateY}]
                }}
            >
                <TouchableOpacity 
                    onPress={async () => {
                        if(songs.length === 0) return;
                        const randomIndex = Math.floor(Math.random()*songs.length);
                        await playQueue(songs, randomIndex);
                    }}
                    className="absolute top-[40%] self-center rounded-full bg-black items-center justify-center mt-8 z-10">
                    <Text className="text-white text-lg font-poppins-semibold py-4 px-8">Shuffle play</Text>
                </TouchableOpacity>
            </Animated.View>
            
            {songsLoading ? (
                <View className="flex-1 items-center justify-center mt-40">
                    <ActivityIndicator size="large" color="white" />
                </View>
            ) : songs.length === 0 ? (
                <View className="flex-1 items-center justify-center mt-40">
                    <Text className="text-gray-600 text-lg font-poppins-medium">
                        Add your first Song.
                    </Text>
                </View>
            ) : (
                <Animated.ScrollView 
                    className="w-full mt-1"
                    style={{ transform: [{translateY: scrollTranslateY}]}}
                    contentContainerStyle={{ paddingTop: 325, paddingBottom: 280}}
                    showsVerticalScrollIndicator= {false}
                    onScroll={Animated.event(
                        [{nativeEvent: {contentOffset: {y: scrollY}}}],
                        {useNativeDriver: true}
                    )}
                    scrollEventThrottle={16}
                >   
                    {
                        songs.map((song, index) => (
                            <SongItem
                                key={song.id ?? index}
                                song={song}
                                index={index}
                                songs={songs}
                                onOptionsPress={() => {
                                    console.log("option for ", song.title);
                                }}
                            />    
                        ))
                    }
                </Animated.ScrollView>
            )}
        </View>
    );
}