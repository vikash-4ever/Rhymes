import SongItem from "@/components/SongItem";
import SongOptions from "@/components/SongOptions";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { getSongsByArtist, getSongsByIds } from "@/lib/api/musicApis";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Image, Modal, Text, TouchableOpacity, View } from "react-native";
import ImageColors from "react-native-image-colors";

export default function FavouriteSongs(){

    const {playShuffledQueue} = usePlayer();
    const {type, id, title, artist, image} = useLocalSearchParams();
    const {user, likedSongs, playlists} = useGlobalContext();
    const [songs, setSongs] = useState<Song[]>([]);
    const [songsLoading, setSongsLoading] = useState(false);
    const [songOptionsModal, setSongOptionsModal] = useState(false);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const scrollY = useState(new Animated.Value(0))[0];
    const playlist = React.useMemo(() => playlists.find(p => p.$id === id), [playlists, id]);
    const [gradientColors, setGradientColors] = React.useState<readonly[string, string]>([
        "#3f3a9b",
        "#000000"
    ]);

    const optimizeImage = (url: string) => {
        return url.replace(
            /\d+x\d+/,
            "256x256"
        );
    };
    
    const imageUri = React.useMemo(() => {
        const rawImage = Array.isArray(image) ? image[0] : image;
        if (rawImage && typeof rawImage === 'string') {
            // Swap 1000x1000 for 500x500 to save 75% memory
            return optimizeImage(rawImage) ;
        }
        return null;
    }, [image]);

    const artistImage = React.useMemo(() => {
        try {
            // If artist is passed as a stringified object
            if (typeof artist === 'string') {
                const parsedArtist = JSON.parse(artist);
                return parsedArtist.image || parsedArtist.picture || parsedArtist.cover;
            }
            return null;
        } catch (e) {
            return null;
        }
    }, [artist]);

    // Final fallback logic
    const finalImageUri = artistImage || imageUri;


    const extractColors = React.useCallback( async (uri: string) => {
        try {
            if (!uri) return;

            console.log("Image uri : ", uri);
            const result = await ImageColors.getColors(uri, {
                fallback: "#3f3a9b",
            });

            if (!result) return;

            if (result.platform === "android") {
                setGradientColors([result.dominant || "#3f3a9b", result.average || "#000000"] as const);
            } else if(result.platform === "ios"){
                setGradientColors([result.background || "#3f3a9b", result.primary || "#000000"] as const);
            } else {
                setGradientColors(["#3f3a9b", "#000000"] as const)
            }
        } catch (error) { 
            console.log("Color extract error : ", error);
        }
    }, []);

    const sourceIds = React.useMemo(() => {
        if (type === "liked") {
            return likedSongs;
        }

        if (type === "playlist") {
            return playlist?.songIds || [];
        }

        return [];
    }, [type, likedSongs, playlist]);

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

    React.useEffect(() => {
        if (type === "liked") {
            setGradientColors(["#3f3a9b", "#000000"]);
            return;
        }

        if (type === "local") {
            setGradientColors(["#3f3f46", "#000000"]);
            return;
        }

        setGradientColors(["#000000", "#000000"])

        if (type === "playlist" && playlist?.coverImage) {
            extractColors(playlist.coverImage);
        } else if (type === "artist" && imageUri) {
            extractColors(imageUri);
            console.log("Rendering artist image:", imageUri);
        }
    },[playlist?.coverImage, type, imageUri]);

    useEffect(() => {

        let mounted = true;

        const loadSongs = async () => {
            setSongsLoading(true);
            const cacheKey =
                type === "artist"
                    ? `ARTIST_${artist}`
                    : type === "liked"
                    ? `LIKED_${user?.$id}`
                    : `PLAYLIST_${id}`;

            try {

                if (type === "playlist") {
                    const currentIds = JSON.stringify(sourceIds);

                    const savedIds = await AsyncStorage.getItem(
                        `${cacheKey}_IDS`
                    );

                    if (savedIds !== currentIds) {
                        await AsyncStorage.multiRemove([
                            cacheKey,
                            `${cacheKey}_IDS`
                        ]);
                    }
                }
                
                const cached = await AsyncStorage.getItem(cacheKey);

                if (cached) {
                    if (mounted) setSongs(JSON.parse(cached));
                    setSongsLoading(false);

                    return;
                }
                if( type === "artist") {
                    const res = await getSongsByArtist(artist as string);

                    const artistSongs = Array.isArray(res)
                        ? res
                        : res?.results || [];

                    if (mounted) setSongs(artistSongs);
                    await AsyncStorage.setItem(
                        cacheKey,
                        JSON.stringify(artistSongs)
                    );
                    return;
                }

                if (!sourceIds || sourceIds.length === 0) {
                    if (mounted) setSongs([]);
                    return;
                }

                const res = await getSongsByIds(sourceIds);
                    
                if(!Array.isArray(res)) return;

                const songMap = new Map(res.map((s: Song) => [s.id, s]));
                const orderedSongs = sourceIds.map(id => songMap.get(id)).filter((s) : s is Song => Boolean(s));
                if (mounted) setSongs(orderedSongs);

                await AsyncStorage.multiSet([
                    [cacheKey, JSON.stringify(orderedSongs)],
                    [`${cacheKey}_IDS`, JSON.stringify(sourceIds)],
                ]);
            } catch (error) {
                console.log("Liked fetch error : ", error);
            } finally {
                setSongsLoading(false);
            }
        };
        loadSongs();
        return () => {
            mounted = false;
        };
    }, [type, id, artist, sourceIds]);

    const renderedSongs = React.useMemo(() => {
        return songs.map((song, index) => (
            <SongItem
                key={song.id ?? index}
                song={song}
                index={index}
                songs={songs}
                onOptionsPress={() => {
                    setSelectedSong(song);
                    setSongOptionsModal(true);
                }}
            />
        ));
    }, [songs]);

    return(
        <View className="flex-1 bg-black">
            <LinearGradient
                colors={[gradientColors[0], "#000000"]}
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
                    zIndex: 100,
                }}
            >
                <View className="h-48 w-48 mt-12 items-center justify-center">
                    {type === "playlist" && playlist?.coverImage ? (
                        <Image
                            source={{uri: playlist.coverImage}}
                            className="h-full w-full rounded-sm"
                        />
                    ) : type === "artist" ? (
                        <View 
                            style={{ width: 168, height: 168, borderRadius: 96, overflow: 'hidden', backgroundColor: '#000000' }}
                        >
                            <Image
                                key={finalImageUri} // Force re-render if URI changes
                                source={finalImageUri
                                    ? {
                                        uri: finalImageUri,
                                        cache: "force-cache",
                                    }
                                    : images.image2
                                }
                                style={{ width: 168, height: 168 }}
                                resizeMode="cover"
                                resizeMethod="resize"
                                fadeDuration={300}
                                progressiveRenderingEnabled
                                onLoad={() => console.log("Success: Image visible")}
                                onError={(e) => console.log("Error: Image failed", e.nativeEvent.error)}
                            />
                        </View>    
                    ) : type === "local" ? (
                        <>
                            <LinearGradient
                                colors={["#bdc4d4", "#3f3f46"]}
                                start={{ x: 0.1, y: 0.1 }}
                                end={{ x: 1, y: 1 }}
                                style={{ flex: 1, width: "100%" }}
                            />
                            <Image source={icons.disk} tintColor={"white"} className="absolute size-16"/>
                        </>
                    ) : (
                            <>
                                <LinearGradient
                                    colors={["#bdc4d4", "#3f3a9b"]}
                                    start={{ x: 0.1, y: 0.1 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{ flex: 1, width: "100%" }}
                                />
                                <Image source={icons.heartFilled} tintColor={"white"} className="absolute size-16"/>
                            </>
                    )}
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
                    transform: [{translateY: textTranslateY}],
                    zIndex: 999,
                    elevation: 999
                }}
            >
                <TouchableOpacity 
                    onPress={async () => {
                        if(songs.length === 0) return;
                        await playShuffledQueue(songs);
                    }}
                    className="self-center rounded-full bg-black items-center justify-center mt-8 z-10">
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
                    style={{ transform: [{translateY: scrollTranslateY}], zIndex: 1}}
                    contentContainerStyle={{ paddingTop: 325, paddingBottom: 660}}
                    showsVerticalScrollIndicator= {false}
                    onScroll={Animated.event(
                        [{nativeEvent: {contentOffset: {y: scrollY}}}],
                        {useNativeDriver: true}
                    )}
                    scrollEventThrottle={16}
                >   
                    {renderedSongs}
                </Animated.ScrollView>
            )}

            <Modal
                visible={songOptionsModal}
                transparent
                animationType="fade"
                onRequestClose={() => setSongOptionsModal(false)}
                >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setSongOptionsModal(false)}
                    className="flex-1 justify-end bg-[#00000080]"
                >
                    <SongOptions
                        song={selectedSong}
                        onClose={() => setSongOptionsModal(false)}
                    />
                </TouchableOpacity>
                </Modal>
        </View>
    );
}