import icons from "@/constants/icons";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import { Animated, Image, Text, TouchableOpacity, View } from "react-native";

export default function LocalAudio() {
    const {playQueue} = usePlayer();
        const [songs, setSongs] = useState<Song[]>([]);
        const scrollY = useState(new Animated.Value(0))[0];
        
        const textTranslateY = scrollY.interpolate({
            inputRange: [0, 200],
            outputRange: [0, -255],
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
                        Local Audios
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
    
                <Animated.ScrollView 
                    className="w-full mt-1"
                    style={{ transform: [{translateY: scrollTranslateY}]}}
                    contentContainerStyle={{ paddingTop: 325}}
                    onScroll={Animated.event(
                        [{nativeEvent: {contentOffset: {y: scrollY}}}],
                        {useNativeDriver: true}
                    )}
                    scrollEventThrottle={16}
                >
                    <TouchableOpacity className="flex-row h-14 w-full bg-[#00000000] justify-between mt-1">
                        <View className="h-16 justify-center px-4 mr-14">
                            <Text className="text-white text-lg font-poppins-semibold px" numberOfLines={1} ellipsizeMode={"tail"}>
                                Tum Hi Ho
                            </Text>
                            <Text className="text-gray-500 text-sm font-poppins-light" numberOfLines={1} ellipsizeMode={"tail"}>Arijit Singh</Text>
                        </View>
                        <TouchableOpacity className="absolute right-0 h-16 w-14 items-center justify-center">
                            <Image source={icons.option} className="size-5" tintColor={"gray"}/>
                        </TouchableOpacity>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row h-14 w-full bg-[#00000000] justify-between mt-1">
                        <View className="h-16 justify-center px-4 mr-14">
                            <Text className="text-white text-lg font-poppins-semibold px" numberOfLines={1} ellipsizeMode={"tail"}>
                                Tu Hai Ki Nahi by Ankit Tiwari
                            </Text>
                            <Text className="text-gray-500 text-sm font-poppins-light" numberOfLines={1} ellipsizeMode={"tail"}>Ankit Tiwari</Text>
                        </View>
                        <TouchableOpacity className="absolute right-0 h-16 w-14 items-center justify-center">
                            <Image source={icons.option} className="size-5" tintColor={"gray"}/>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </Animated.ScrollView>
            </View>
        );
}