import icons from "@/constants/icons";
import { getSongsByIds, searchSongs } from "@/lib/api/musicApis";
import { deleteSearchHistory, getSearchHistory, saveSearchHistory } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {

    const {user} = useGlobalContext();
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Song[]>([]);
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [recentSongs, setRecentSongs] = useState<Song[]>([]);
    const [navigating, setNavigating] = useState(false);
    const {playQueue} = usePlayer();

    const cancelTokenRef = useRef<AbortController | null>(null);

    const rankSongs = (songs: Song[], query: string) => {
        const q = query.toLowerCase();

        return songs
            .map((song) => {
            const title = song.title.toLowerCase();

            let score = 0;

            if (title.startsWith(q)) score += 100; // 🔥 highest priority
            else if (title.includes(" " + q)) score += 70;
            else if (title.includes(q)) score += 50;

            // fuzzy (tu vs tum)
            if (q.length >= 2 && title.includes(q.slice(0, 2))) score += 20;

            return { song, score };
            })
            .sort((a, b) => b.score - a.score)
            .map((item) => item.song);
    };

    useEffect(() => {

  const loadHistory = async () => {

        if (!user) return;

        const historyDocs =
        await getSearchHistory(user.$id);

        const ids = historyDocs.map(
        (doc: any) => doc.songId
        );

        if (ids.length === 0) {
        setRecentSongs([]);
        return;
        }

        const songs = await getSongsByIds(ids);

        const songMap = new Map(
        songs.map((song: Song) => [song.id, song])
        );

        const orderedSongs = ids
        .map((id: string) => songMap.get(id))
        .filter((song): song is Song => Boolean(song));

        setRecentSongs(orderedSongs);

    };

    loadHistory();

    }, [user]);

    useEffect(() => {
        const timer = setTimeout(() => {
        setDebouncedQuery(query.trim());
        }, 600);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const fetchResults = async () => {

            if (!debouncedQuery) {
                setResults([]);
                return;
            }

            setLoading(true);

            try {

                const res = await searchSongs(debouncedQuery);
                const ranked = rankSongs(res || [], debouncedQuery);
                setResults(ranked);

            } catch (err) {

                console.error("Search failed!", err);

                setResults([]);

            } finally {

                setLoading(false);

            }

            };

            fetchResults();

    }, [debouncedQuery]);

    const handleSongPress = async (
        item: Song,
        queue: Song[],
        index: number
    ) => {

        if (navigating) return;

        try {

            setNavigating(true);

            Keyboard.dismiss();

            // update local recent instantly
            setRecentSongs((prev) => {

                const filtered = prev.filter(
                    (song) => song.id !== item.id
                );

                return [item, ...filtered];
            });

            // save in background
            if (user) {
                saveSearchHistory(
                    user.$id,
                    item.id
                );
            }

            router.push({
                pathname: "/searchResult",
                params: {
                    result: JSON.stringify(item),
                    queue: JSON.stringify(queue),
                    index,
                },
            });

        } finally {

            setTimeout(() => {
                setNavigating(false);
            }, 800);

        }
    };

    const handleDeleteRecentSong = async (
        songId: string
    ) => {

        if (!user) return;

        // instant UI update
        setRecentSongs((prev) =>
            prev.filter(
                (song) => song.id !== songId
            )
        );

        // delete from appwrite
        await deleteSearchHistory(
            user.$id,
            songId
        );
    };

    const handleClearAllRecent = async () => {

        if (!user) return;

        // instant UI update
        setRecentSongs([]);

        // clear database
        await deleteSearchHistory(
            user.$id
        );
    };

    const handleSubmit = () => {
        Keyboard.dismiss();
    };

    return(
        <View className="flex h-full bg-primary-200">
            <View className="flex flex-row w-full h-14 bg-primary-300 items-center justify-between pr-2 gap-5">
                <TouchableOpacity 
                    onPress={() => router.push('/(root)/(tabs)/search')} 
                    className="items-center justify-center h-full w-14"
                >
                    <Image source={icons.back} tintColor={'white'} className="size-5 my-5"/>
                </TouchableOpacity>
                <TextInput 
                    placeholder="Search artist, song or paste link" 
                    placeholderTextColor={'#6f7684'} 
                    cursorColor={'white'} 
                    className="flex-1 text-white text-lg"
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                    }}
                    onSubmitEditing={handleSubmit}
                    autoFocus
                />
                {query.trim() !== "" && (
                    <TouchableOpacity
                        className="items-center justify-center h-full w-14"
                        onPress={() => {
                            setQuery(""); 
                            setResults([]);
                            if (cancelTokenRef.current) cancelTokenRef.current.abort();
                        }}>
                        <Image source={icons.cancel} tintColor={'white'} className="size-5"/>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#fff" className="mt-20" />
            ) : query.trim() === "" ?(
                <View className="flex-1 px-3 pt-5">

                    {recentSongs.length > 0 ? (
                        <>
                            <View className="flex-row items-center justify-center mb-4">
                                <Text className="text-white text-xl font-poppins-semibold">
                                    Recent Searches
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-end mb-4">
                                <TouchableOpacity
                                    onPress={handleClearAllRecent}
                                    className="h-8 w-auto justify-center"
                                >
                                    <Text className="text-text2 font-poppins-medium text-sm mx-2">
                                        Clear all
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <FlatList
                                data={recentSongs}
                                keyboardShouldPersistTaps="handled"
                                keyExtractor={(item, index) =>
                                    item.id || index.toString()
                                }
                                showsVerticalScrollIndicator={false}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        className="w-full py-2"
                                        onPress={() => {
                                            handleSongPress(
                                                item,
                                                recentSongs,
                                                index,
                                            )
                                       }}
                                    >
                                        <View className="flex-row items-center gap-3">
                                            <Image
                                                source={
                                                    item.thumbnail_url
                                                        ? { uri: item.thumbnail_url }
                                                        : icons.disk
                                                }
                                                resizeMode="stretch"
                                                className="h-12 w-12"
                                            />

                                            <View className="flex-1">
                                                <Text
                                                    className="text-white text-lg"
                                                    numberOfLines={1}
                                                >
                                                    {item.title}
                                                </Text>

                                                <Text
                                                    className="text-gray-500 text-sm"
                                                    numberOfLines={1}
                                                >
                                                    {item.artists
                                                        ?.map((a) => a.name)
                                                        .join(", ") ||
                                                        "Unknown Artist"}
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                onPress={() =>
                                                    handleDeleteRecentSong(
                                                        item.id
                                                    )
                                                }
                                                className="p-3"
                                                hitSlop={{
                                                    top: 10,
                                                    bottom: 10,
                                                    left: 10,
                                                    right: 10,
                                                }}
                                            >
                                                <Image
                                                    source={icons.cancel}
                                                    tintColor={"#6B7280"}
                                                    className="size-5"
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    ) : (
                        <View className="h-full items-center justify-center gap-2">
                            <Text className="text-white text-lg font-poppins-medium">
                                Find the music you love
                            </Text>

                            <Text className="text-sm text-gray-400 font-poppins-medium">
                                From millions of artists, songs and playlists.
                            </Text>
                        </View>
                    )}
                </View>
            ) : results.length === 0 ? (
                <View className="h-full items-center justify-center gap-2">
                    <Text className="text-white text-lg font-poppins-medium">
                        No results found
                    </Text>

                    <Text className="text-sm text-gray-400 font-poppins-medium">
                        Try searching something else.
                    </Text>
                </View>
            ) : (
                <View className="flex-1">
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item, index }) => ( 
                            <TouchableOpacity
                                className="w-full py-2 px-3"
                                onPress={() => {
                                    handleSongPress(
                                        item,
                                        results,
                                        index,
                                    )
                                }}
                                >
                                <View className="flex-row items-center gap-3">
                                    <Image
                                        source={item.thumbnail_url ? { uri: item.thumbnail_url } : icons.disk}
                                        resizeMode="stretch"
                                        className="h-12 w-12"
                                    />
                                    <View className="flex-1">
                                    <Text className="text-md text-white text-lg" ellipsizeMode="tail" numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text className="text-sm text-gray-500" ellipsizeMode="tail" numberOfLines={1}>
                                        {item.artists?.map(a => a.name).join(", ") || "Unknown Artist"}
                                    </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    )
}