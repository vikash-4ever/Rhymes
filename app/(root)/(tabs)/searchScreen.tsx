import icons from "@/constants/icons";
import { searchSong } from "@/lib/songsApi";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Keyboard, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SearchScreen() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [debouncedQuery, setDebouncedQuery] = useState("");

    const cancelTokenRef = useRef<AbortController | null>(null);

    useEffect(() =>{
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), 600);
        return() => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const fetchResults = async () => {
            // ⛔ If empty → clear immediately
            if (!debouncedQuery) {
            setResults([]);
            setLoading(false);         // no results, no loader
            if (cancelTokenRef.current) cancelTokenRef.current.abort();
            return;
            }

            // ✨ Important:
            // Loader should start ONLY after debounce,
            // because this means user has STOPPED typing.
            setLoading(true);

            // Cancel previous request
            if (cancelTokenRef.current) {
            cancelTokenRef.current.abort();
            }

            const controller = new AbortController();
            cancelTokenRef.current = controller;

            try {
            const res = await searchSong(debouncedQuery, controller.signal);

            if (res?.status === "success") {
                setResults(res.results);
            } else {
                setResults([]);
            }

            } catch (err: any) {
            if (err.name === "AbortError" || err.message === "canceled") {
                return; // ignore cancelled
            }
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
                        from millions of artists, songs and playlists
                    </Text>
                </View>
            ) : (
                <View className="flex-1">
                    <FlatList
                        data={results}
                        keyExtractor={(item, index) => item.id || index.toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => ( 
                            <TouchableOpacity
                                className="w-full py-2 px-3"
                                onPress={() => {
                                    router.push({
                                        pathname: "/searchResult",
                                        params: { result: JSON.stringify(item) }
                                    });
                                }}
                                >
                                <View className="flex-row items-center gap-3">
                                    <Image
                                        source={item.thumbnail ? { uri: item.thumbnail } : icons.disk}
                                        resizeMode="stretch"
                                        className="h-12 w-12"
                                    />
                                    <View className="flex-1">
                                    <Text className="text-md text-white text-lg" ellipsizeMode="tail" numberOfLines={1}>
                                        {item.title}
                                    </Text>
                                    <Text className="text-sm text-gray-500" ellipsizeMode="tail" numberOfLines={1}>
                                        {item.artist || "Unknown Artist"}
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