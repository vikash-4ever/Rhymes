import SongItem from "@/components/SongItem";
import SongOptions from "@/components/SongOptions";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { getSongsByArtist, getSongsByCategory, getSongsByIds } from "@/lib/api/musicApis";
import { useGlobalContext } from "@/lib/global-provider";
import { QueueContext, usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Image,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import ImageColors from "react-native-image-colors";

export default function SongsList() {

    const { playQueue, setNavigationContext, playShuffledQueue } = usePlayer();

    const { type, id, title, artist, image, category, color, source } = useLocalSearchParams();

    const {
        user,
        likedSongs,
        playlists,
        likedArtists,
        handleToggleArtist
    } = useGlobalContext();

    const [songs, setSongs] = useState<Song[]>([]);
    const [songsLoading, setSongsLoading] = useState(false);

    const [songOptionsModal, setSongOptionsModal] = useState(false);
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const scrollY = React.useRef(new Animated.Value(0)).current;

    const headerFade = scrollY.interpolate({
        inputRange: [140, 220],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const heroOpacity = scrollY.interpolate({
        inputRange: [60, 240],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    const heroScale = scrollY.interpolate({
        inputRange: [0, 280],
        outputRange: [1, 0.84],
        extrapolate: "clamp",
    });

    const heroTranslateY = scrollY.interpolate({
        inputRange: [0, 280],
        outputRange: [0, -8],
        extrapolate: "clamp",
    });

    useEffect(() => {
        scrollY.setValue(0);
    }, [id, artist, category, type]);

    const playlist = React.useMemo(
        () => playlists.find(p => p.$id === id),
        [playlists, id]
    );

    const currentRoute: QueueContext["route"] =
    source === "search"
        ? "/(root)/(tabs)/search/listScreen"
        : source === "favourites"
        ? "/(root)/(tabs)/favourites/listScreen"
        : "/(root)/(tabs)/home/listScreen";


    useEffect(() => {
        setNavigationContext({
            route: currentRoute,
            source: source as "home" | "search" | "favourites",
        });
    }, [currentRoute, source]);

    const currentQueueContext = React.useMemo<QueueContext>(() => {
        switch (type) {
            case "artist":
                return {
                    type: "artist",
                    title: title as string,
                    route: currentRoute,
                    params: {
                        type: "artist",
                        title: title as string,
                        artist: artist as string,
                        image: image as string,
                        source: source as string,
                    },
                };

            case "category":
                return {
                    type: "category",
                    title: title as string,
                    route: currentRoute,
                    params: {
                        type: "category",
                        category: category as string,
                        title: title as string,
                        color: color as string,
                        source: source as string,
                    },
                };

            case "playlist":
                return {
                    type: "playlist",
                    title: title as string,
                    route: currentRoute,
                    params: {
                        type: "playlist",
                        id: id as string,
                        title: title as string,
                        source: source as string,
                    },
                };

            case "liked":
                return {
                    type: "liked",
                    title: "Favourite Songs",
                    route: currentRoute,
                    params: {
                        type: "liked",
                        title: "Favourite Songs",
                        source: source as string,
                    },
                };

            case "local":
                return {
                    type: "local",
                    title: "Local Audio Files",
                    route: currentRoute,
                    params: {
                        type: "local",
                        title: "Local Audio Files",
                        source: source as string,
                    },
                };

            default:
                throw new Error(`Unsupported queue type: ${type}`);
        }
    }, [
        type,
        id,
        title,
        artist,
        image,
        category,
        color,
        source,
        currentRoute,
    ]);

    const [gradientColors, setGradientColors] = React.useState<
        readonly [string, string]
    >([
        "#000000",
        "#000000"
    ]);

    const optimizeImage = (url: string) => {
        return url.replace(/\d+x\d+/, "256x256");
    };

    const imageUri = React.useMemo(() => {

        const rawImage = Array.isArray(image)
            ? image[0]
            : image;

        if (rawImage && typeof rawImage === "string") {
            return optimizeImage(rawImage);
        }

        return null;

    }, [image]);

    const isArtistLiked =
        type === "artist" &&
        likedArtists.includes(artist as string);

    const finalImageUri = imageUri;

    const extractColors = React.useCallback(async (uri: string) => {

        try {

            if (!uri) return;

            const result = await ImageColors.getColors(uri, {
                fallback: "#000000",
            });

            if (!result) return;

            if (result.platform === "android") {

                setGradientColors([
                    result.dominant || "#3f3a9b",
                    result.average || "#000000"
                ] as const);

            } else if (result.platform === "ios") {

                setGradientColors([
                    result.background || "#3f3a9b",
                    result.primary || "#000000"
                ] as const);

            } else {

                setGradientColors([
                    "#3f3a9b",
                    "#000000"
                ] as const);

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

    React.useEffect(() => {

        setGradientColors([
            "#000000",
            "#000000"
        ]);

        if (type === "liked") {

            setGradientColors([
                "#3f3a9b",
                "#000000"
            ]);

            return;

        }

        if (type === "local") {

            setGradientColors([
                "#3f3f46",
                "#000000"
            ]);

            return;

        }

        if (type === "category") {
            setGradientColors([
                (color as string) || "#3f3a9b",
                "#000000"
            ]);
            return;
        }

        if (type === "playlist") {

            if (playlist?.coverImage) {

                extractColors(playlist.coverImage);

            } else {

                setGradientColors([
                    "#374151",
                    "#000000"
                ]);

            }

            return;
        }

        setGradientColors([
            "#000000",
            "#000000"
        ]);

        if (type === "playlist" && playlist?.coverImage) {

            extractColors(playlist.coverImage);

        } else if (type === "artist" && imageUri) {

            extractColors(imageUri);

        }

    }, [playlist?.coverImage, type, imageUri, color]);

    useEffect(() => {

        let mounted = true;

        setSongs([]);
        setSongsLoading(true);

        const loadSongs = async () => {

            const cacheKey =
                type === "artist"
                    ? `ARTIST_${artist}`
                    : type === "category"
                    ? `CATEGORY_${category}`
                    : type === "liked"
                    ? `LIKED_${user?.$id}`
                    : `PLAYLIST_${id}`;

            try {

                if (type === "playlist" || type === "liked") {

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
                    setSongs(JSON.parse(cached));
                    setSongsLoading(false);
                    return;
                }

                if (type === "artist") {

                    const res = await getSongsByArtist(
                        artist as string
                    );

                    const artistSongs = Array.isArray(res)
                        ? res
                        : res?.results || [];

                    if (mounted) {
                        setSongs(artistSongs);
                    }

                    await AsyncStorage.setItem(
                        cacheKey,
                        JSON.stringify(artistSongs)
                    );

                    return;

                }

                if (type === "category") {

                    const res =
                        await getSongsByCategory(
                            category as string
                        );

                    const categorySongs =
                        Array.isArray(res)
                            ? res
                            : res?.results || [];

                    if (mounted) {
                        setSongs(categorySongs);
                    }

                    await AsyncStorage.setItem(
                        cacheKey,
                        JSON.stringify(categorySongs)
                    );

                    return;
                }

                if (!sourceIds || sourceIds.length === 0) {

                    if (mounted) {
                        setSongs([]);
                    }

                    return;

                }

                const res = await getSongsByIds(sourceIds);

                if (!Array.isArray(res)) return;

                const songMap = new Map(
                    res.map((s: Song) => [s.id, s])
                );

                const orderedSongs = sourceIds
                    .map(id => songMap.get(id))
                    .filter((s): s is Song => Boolean(s));

                if (mounted) {
                    setSongs(orderedSongs);
                }

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

    }, [type, id, artist, category, sourceIds]);

    const handleOptionsPress = useCallback((song: Song) => {
        setSelectedSong(song);
        setSongOptionsModal(true);
    }, []);

    const renderedSongs = React.useMemo(() => {

        return songs.map((song, index) => (

            <SongItem
                key={song.id ?? index}
                song={song}
                index={index}
                songs={songs}
                onOptionsPress={() => handleOptionsPress(song)}
                queueContext={currentQueueContext}
            />

        ));

    }, [songs, currentQueueContext, handleOptionsPress]);

    return (

        <View className="flex-1 bg-black">

            <LinearGradient
                colors={[gradientColors[0], "#000000"]}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.1, y: 0.7 }}
                className="absolute inset-0"
            />

            {/* Sticky Header */}
            <View
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 56,

                    zIndex: 20,

                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",

                    paddingHorizontal: 8,

                }}
            >
                {/* Background */}
                <Animated.View
                    pointerEvents="none"
                    style={{
                        position: "absolute",
                        inset: 0,
                        opacity: headerFade,
                    }}
                >
                    <LinearGradient
                        colors={[
                            "#000000",
                            "#000000DD",
                            "#00000080",
                            "#00000000",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>

                {/* Left */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="h-14 w-14 items-center justify-center"
                >
                    <Image
                        source={icons.back}
                        className="size-6"
                        tintColor="white"
                    />
                </TouchableOpacity>

                {/* Title */}
                <Animated.Text
                    numberOfLines={1}
                    className="flex-1 text-center text-white font-poppins-semibold text-lg"
                    style={{opacity: headerFade}}
                >
                    {title || "Songs"}
                </Animated.Text>

                {/* Right */}
                {type === "artist" ? (
                    <TouchableOpacity
                        onPress={() =>
                            handleToggleArtist(artist as string)
                        }
                        className="h-14 w-14 items-center justify-center"
                    >
                        <Image
                            source={
                                isArtistLiked
                                    ? icons.starFilled
                                    : icons.star
                            }
                            tintColor="white"
                            className="size-6"
                        />
                    </TouchableOpacity>
                ) : (
                    <View className="h-14 w-14" />
                )}

            </View>            

            {/* Songs list */}
            {songsLoading ? (

                <View className="flex-1 items-center justify-center mt-40">
                    <ActivityIndicator
                        size="large"
                        color="white"
                    />
                </View>

            ) : songs.length === 0 ? (

                <View className="flex-1 items-center justify-center mt-40">

                    <Text className="text-gray-600 text-lg font-poppins-medium">
                        No songs found.
                    </Text>

                </View>

            ) : (

                <Animated.ScrollView
                    className="w-full"
                    style={{
                        zIndex: 1
                    }}
                    contentContainerStyle={{
                        paddingTop: 18,
                        paddingBottom: 100
                    }}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{
                            nativeEvent: {
                                contentOffset: {
                                    y: scrollY
                                }
                            }
                        }],
                        {
                            useNativeDriver: true
                        }
                    )}
                    scrollEventThrottle={16}
                >
                    <Animated.View
                        style={{
                            opacity: heroOpacity,
                            transform: [
                                {
                                    translateY: heroTranslateY,
                                },
                                {
                                    scale: heroScale,
                                },
                            ],
                        }}
                    >


                        {/* Image */}
                        <View
                            style={{
                                alignSelf: "center",
                                alignItems: "center",
                            }}
                        >

                            <View className="h-48 w-48 mt-12 items-center justify-center">

                                {type === "playlist" ? (

                                    playlist?.coverImage ? (

                                        <Image
                                            source={{ uri: playlist.coverImage }}
                                            className="h-full w-full rounded-sm"
                                        />

                                    ) : (

                                        <>
                                            <LinearGradient
                                                colors={[
                                                    "#bdc4d4",
                                                    "#374151"
                                                ]}
                                                start={{
                                                    x: 0.1,
                                                    y: 0.1
                                                }}
                                                end={{
                                                    x: 1,
                                                    y: 1
                                                }}
                                                style={{
                                                    flex: 1,
                                                    width: "100%"
                                                }}
                                            />

                                            <Image
                                                source={icons.music}
                                                tintColor="white"
                                                className="absolute size-16"
                                            />
                                        </>

                                    )

                                ) : type === "artist" ? (

                                    <View
                                        style={{
                                            width: 168,
                                            height: 168,
                                            borderRadius: 96,
                                            overflow: "hidden",
                                            backgroundColor: "#000000"
                                        }}
                                    >

                                        <Image
                                            key={finalImageUri}
                                            source={
                                                finalImageUri
                                                    ? {
                                                        uri: finalImageUri,
                                                        cache: "force-cache",
                                                    }
                                                    : images.artist
                                            }
                                            tintColor={
                                                !finalImageUri
                                                    ? "white"
                                                    : undefined
                                            }
                                            style={{
                                                width: 168,
                                                height: 168
                                            }}
                                            resizeMode="cover"
                                            resizeMethod="resize"
                                            fadeDuration={300}
                                            progressiveRenderingEnabled
                                        />

                                    </View>

                                ) : type === "local" ? (

                                    <>
                                        <LinearGradient
                                            colors={[
                                                "#bdc4d4",
                                                "#3f3f46"
                                            ]}
                                            start={{
                                                x: 0.1,
                                                y: 0.1
                                            }}
                                            end={{
                                                x: 1,
                                                y: 1
                                            }}
                                            style={{
                                                flex: 1,
                                                width: "100%"
                                            }}
                                        />

                                        <Image
                                            source={icons.disk}
                                            tintColor={"white"}
                                            className="absolute size-16"
                                        />
                                    </>

                                ) : type === "category" ? (

                                    <>
                                        <LinearGradient
                                            colors={[
                                                "#00000060",
                                                (color as string) || gradientColors[0]
                                            ]}
                                            start={{
                                                x: 0.1,
                                                y: 0.1
                                            }}
                                            end={{
                                                x: 1,
                                                y: 1
                                            }}
                                            style={{
                                                flex: 1,
                                                width: "100%"
                                            }}
                                        />

                                        <Image
                                            source={icons.music}
                                            tintColor={"white"}
                                            className="absolute size-16"
                                        />
                                    </>

                                ) : (

                                    <>
                                        <LinearGradient
                                            colors={[
                                                "#bdc4d4",
                                                "#3f3a9b"
                                            ]}
                                            start={{
                                                x: 0.1,
                                                y: 0.1
                                            }}
                                            end={{
                                                x: 1,
                                                y: 1
                                            }}
                                            style={{
                                                flex: 1,
                                                width: "100%"
                                            }}
                                        />

                                        <Image
                                            source={icons.heartFilled}
                                            tintColor={"white"}
                                            className="absolute size-16"
                                        />
                                    </>

                                )}

                            </View>

                        </View>

                        {/* Title */}
                        <Text
                            style={{
                                alignSelf: "center",
                                marginVertical: 12,
                            }}
                            className="font-poppins-bold text-xl text-white"
                            numberOfLines={2}
                        >
                            {title || "Songs"}
                        </Text>

                        {/* Shuffle button */}
                        <View
                            style={{
                                alignSelf: "center",
                                marginBottom: 16
                            }}
                        >

                            <TouchableOpacity
                                onPress={async () => {

                                    if (songs.length === 0) return;

                                    await playShuffledQueue(songs, currentQueueContext);

                                }}
                                style={{
                                    backgroundColor: gradientColors[0]
                                }}
                                className="self-center rounded-full items-center justify-center mt-4 z-10"
                            >

                                <Text className="text-[#ffffff] text-lg font-poppins-semibold py-4 px-8">
                                    Shuffle play
                                </Text>

                            </TouchableOpacity>

                        </View>
                    </Animated.View>

                    {renderedSongs}

                </Animated.ScrollView>

            )}

            {/* Song options */}
            <Modal
                visible={songOptionsModal}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setSongOptionsModal(false)
                }
            >

                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() =>
                        setSongOptionsModal(false)
                    }
                    className="flex-1 justify-end bg-[#00000080]"
                >

                    <SongOptions
                        song={selectedSong}
                        onClose={() =>
                            setSongOptionsModal(false)
                        }
                    />

                </TouchableOpacity>

            </Modal>

        </View>

    );
}