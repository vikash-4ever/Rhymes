import icons from "@/constants/icons";
import { searchSongs } from "@/lib/api/musicApis";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Song[]>([]);
    const [debouncedQuery, setDebouncedQuery] = useState("");
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

    const handleSubmit = () => {
        Keyboard.dismiss();
    };

    return(
        <View className="flex h-full bg-primary-200">
            <View className="flex flex-row w-full bg-primary-300 items-center justify-between px-5 gap-5">
                <TouchableOpacity 
                    onPress={() => router.push('/(root)/(tabs)/search')} 
                    className="items-center justify-center"
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
            ) : results.length === 0 ? (
                <View className="h-full mt-[80%] items-center gap-2">
                    <Text className="text-white text-lg font-poppins-medium">
                        Find the music you love
                    </Text>
                    <Text className="text-sm text-gray-400 font-poppins-medium">
                        From millions of artists, songs and playlists.
                    </Text>
                </View>
            ) : (
                <View className="flex-1">
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => ( 
                            <TouchableOpacity
                                className="w-full py-2 px-3"
                                onPress={() => {
                                    router.push({
                                        pathname: "/searchResult",
                                        params: {
                                            result: JSON.stringify(item),
                                            queue: JSON.stringify(results),
                                            index: index
                                        }
                                    });
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