import icons from "@/constants/icons";
import images from "@/constants/images";
import { getSongsByArtist } from "@/lib/api/musicApis";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Animated, Image, Text, TouchableOpacity, View } from "react-native";

export default function ArtistSongs () {
    const {artist} = useLocalSearchParams();
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);
    const {playQueue} = usePlayer();
    const scrollY = useState(new Animated.Value(0))[0];

    const scrollTranslateY = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [8, 48],
        extrapolate: "clamp",
    });

    const textTranslateY = scrollY.interpolate({
        inputRange: [0, 200],
        outputRange: [0, -255],
        extrapolate: "clamp",
    });
    const imageOpacity = scrollY.interpolate({
        inputRange: [0, 150],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    useEffect(() => {
        const loadSongs = async () => {
            setLoading(true);   
            try{
                const res = await getSongsByArtist(artist as string);
                setSongs(Array.isArray(res) ? res : res?.results || []);
            } catch(error){
                console.log("Artist songs error!", error);
            } finally {
                setLoading(false);
            }
        };
        loadSongs();
    }, [artist]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-black">
                <ActivityIndicator size="large" color={"white"}/>
            </View>
        )
    }

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
                <Image source={images.image1} className="absolute z-10 self-center top-20 h-48 w-48"/>
            </Animated.View>

            <Animated.Text
                style= {{
                    position: "absolute",
                    top: "38%",
                    alignSelf: "center",
                    transform:[{translateY: textTranslateY}]
                }}
                className="font-poppins-bold text-xl text-white" numberOfLines={2}>{artist}
            </Animated.Text>

            <Animated.View
                style= {{
                    position: "absolute",
                    top: "40%",
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

            <Animated.ScrollView 
                className="w-full mt-1"
                style={{ transform: [{translateY: scrollTranslateY}]}}
                contentContainerStyle={{ paddingTop: 350}}
                showsVerticalScrollIndicator= {false}
                onScroll={Animated.event(
                    [{nativeEvent: {contentOffset: {y: scrollY}}}],
                    {useNativeDriver: true}
                )}
                scrollEventThrottle={16}
            >
                    {songs.map((song, index) => (
                        <TouchableOpacity 
                            key={song.id}
                            className="flex-row h-14 w-full bg-[#00000000] justify-between mt-1"
                            onPress={async () => {
                                await playQueue(songs, index);
                            }}
                        >
                            <View className="h-16 justify-center px-4 mr-14">
                                <Text 
                                    className="text-white text-lg font-poppins-semibold" 
                                    numberOfLines={1} 
                                    ellipsizeMode={"tail"}
                                >
                                    {song.title}
                                </Text>
                                <Text 
                                    className="text-gray-500 text-sm font-poppins-light" 
                                    numberOfLines={1} 
                                    ellipsizeMode={"tail"}
                                >
                                    {song.artists?.map(a => a.name).join(", ")}
                                </Text>
                            </View>
                            <TouchableOpacity className="absolute right-0 h-14 w-14 items-center justify-center">
                                <Image source={icons.option} className="size-5" tintColor={"gray"}/>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))}
                </Animated.ScrollView>
        </View>
    )
}