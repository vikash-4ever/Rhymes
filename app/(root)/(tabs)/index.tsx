import HomeSkeleton from "@/components/HomeSkeleton";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { getRecentSongs, getSongsByIds, getTrendingSongs } from "@/lib/api/musicApis";
import { getEditorsPick } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Index() {

  const {user, recentlyPlayed, artistImages, loadArtistImage, setArtistImages} = useGlobalContext();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const {playQueue} = usePlayer();
  const [editorsPickSongs, setEditorsPickSongs] = useState<Song[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const firstName = user?.name?.split(" ")[0];

  // trying to add local cache for popular & recommendations
  const CACHE_KEY = "HOME_CACHE";
  const CACHE_TTL = 1000 * 60 * 60 * 12;
  //--------------------------------------

  const getGreetingData = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 7)
    return { text: "Good Morning", color: "#FFE08A" }; // Dawn

  if (hour >= 7 && hour < 9)
    return { text: "Good Morning", color: "#FFD166" }; // Sunrise

  if (hour >= 9 && hour < 11)
    return { text: "Good Morning", color: "#F4C96B" }; // Warm Gold

  if (hour >= 11 && hour < 13)
    return { text: "Good Afternoon", color: "#FFC98A" }; // Light Peach

  if (hour >= 13 && hour < 15)
    return { text: "Good Afternoon", color: "#FFB98F" }; // Soft Coral

  if (hour >= 15 && hour < 17)
    return { text: "Good Afternoon", color: "#F3A8A3" }; // Blush

  if (hour >= 17 && hour < 18)
    return { text: "Good Evening", color: "#E79BCB" }; // Pink Sunset

  if (hour >= 18 && hour < 19)
    return { text: "Good Evening", color: "#D89AF7" }; // Lavender

  if (hour >= 19 && hour < 20)
    return { text: "Good Evening", color: "#C29CFF" }; // Purple

  if (hour >= 20 && hour < 22)
    return { text: "Good Evening", color: "#A88BFF" }; // Twilight

  if (hour >= 22 && hour < 24)
    return { text: "Good Evening", color: "#8F97E8" }; // Moonlight

  return { text: "Good Evening", color: "#7A8FCF" }; // Deep Night (0–5)
};

  const greeting = getGreetingData();

  React.useEffect(() => {
    let mounted = true;
      const loadHomeData = async () => {
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          
          if (cached) {
            const parsed = JSON.parse(cached);
            const isValid = Date.now() - parsed.time < CACHE_TTL;

            if (isValid && mounted) {
              setTrendingSongs(parsed.trending || []);
              setRecentSongs(parsed.recent || []);
              setArtists(parsed.artists || []);
              setEditorsPickSongs(parsed.editorsPickSongs || []);
              setArtistImages(parsed.artistImages || []);
              setInitialLoading(false);
            }
          }
          
          const [trendingRes, recentRes, editorsPickDocs] = await Promise.all([
            getTrendingSongs(),
            getRecentSongs(),
            getEditorsPick(),
          ]);
          
          const editorSongIds = Array.isArray(editorsPickDocs)
            ? editorsPickDocs.map((doc: any) => doc.songId)
            : [];

          let orderedEditorSongs: Song[] = [];

          if (editorSongIds.length > 0) {
            
            const editorRes = await getSongsByIds(editorSongIds);

            const editorSongs = Array.isArray(editorRes)
              ? editorRes
              : editorRes?.results || [];

            const songMap = new Map(
              editorSongs.map((song: Song) => [song.id, song])
            );

            orderedEditorSongs = editorSongIds
              .map((id: string) => songMap.get(id))
              .filter((s): s is Song => Boolean(s));
          }
        
          const artistCount: Record<string, number> = {};

          trendingRes.forEach((song: Song) => {
            song.artists?.forEach((artist) => {
              const name = artist.name;
              artistCount[name] = (artistCount[name] || 0) +1;
            });
          });

          const topArtists = Object.entries(artistCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15) 
          .map(([name]) => name);

          if (mounted) {
            setTrendingSongs(trendingRes || []);
            setRecentSongs(recentRes || []);
            setArtists(topArtists);
            setEditorsPickSongs(orderedEditorSongs);
          }

          setInitialLoading(false);

          const imageEntries = await Promise.all(
            topArtists.map(async (artist) => {
              const image = await loadArtistImage(artist);

              return [artist, image];
            })
          );

          const imagesMap = Object.fromEntries(
            imageEntries.filter(([_, image]) => image)
          );

          AsyncStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              time: Date.now(),
              trending: trendingRes || [],
              recent: recentRes || [],
              artists: topArtists,
              artistImages: imagesMap,
              editorsPickSongs: orderedEditorSongs,
            })
          );

        } catch (error) {
          console.log("Home load error", JSON.stringify(error, null, 2));
        } finally {
          setInitialLoading(false);
        }
      };
      
      loadHomeData();
      return () => {
        mounted = false;
      };
    }, []);

    if (initialLoading ) {
      return <HomeSkeleton />;
    }

  return (
        <ScrollView className="flex flex-1 h-full bg-primary-200" showsVerticalScrollIndicator={false}>
          <View className="flex-1 flex-row justify-between items-center pl-4 ">
            <Text
              className="text-2xl font-poppins-light flex-1"
              numberOfLines={1}
            >
              <Text style={{ color: greeting.color }}>
                {`${greeting.text}, `}
              </Text>
              {!user?.isGuest && (
                <Text className="text-text1 text-xl font-poppins-semibold">
                  {`${firstName}`}
                </Text>
              )}
            </Text>
            <TouchableOpacity onPress={()=> router.push("/(root)/settingsScreen")} className="h-14 w-14 items-center justify-center">
              <Image source={icons.setting} tintColor={"white"} className="size-7"/>
            </TouchableOpacity>
          </View>
          {recentlyPlayed.length > 0 && (
              <View className="flex flex-col">
                <View className="flex flex-row px-4 mt-2 items-center">
                  <Text className="text-2xl text-text1 font-poppins-semibold ">Recently Played</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 ml-4">
                    {recentlyPlayed.filter(Boolean).map((item, index) => (
                      <TouchableOpacity
                      key={index}
                        className="mr-4"
                        onPress={async() => {
                          await playQueue(recentlyPlayed, index, {
                            type: "recent",
                            title: "Recent",
                            route: "/(root)/(tabs)/home/listScreen",
                          });
                        }}
                      >
                        <Image
                          source={item.thumbnail_url ? { uri: item.thumbnail_url } : require("@/constants/images").image1}
                          className="h-32 w-32 rounded-sm"
                          />
                        <Text className="text-text1 font-bold w-32 mt-2" numberOfLines={1} ellipsizeMode="tail">
                          {item.title}
                        </Text>
                      </TouchableOpacity>
                    ))}          
                </ScrollView>
              </View>
            )
          }
    
          <View className={`flex flex-row p-4 items-center ${recentlyPlayed.length > 0 ? "mt-6" : "mt-0"}`}>
            <Text className="text-2xl text-text1 font-poppins-semibold ">Made for you</Text>
          </View>
    
          <View className="flex-row justify-between pl-4 pr-6">
            {recentSongs.slice(0, 2).map((item, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={async () => {
                  await playQueue(recentSongs, index, {
                    type: "recommendation",
                    title: "Made for you",
                    route: "/(root)/(tabs)/home/listScreen",
                  });
                }} 
                className="w-44 mr-4"
              >
                <Image source={{uri: item.thumbnail_url}} className="h-44 w-44 rounded-sm"/>
                <Text className=" text-text1 text-md font-poppins-semibold mt-2" numberOfLines={2} ellipsizeMode="tail" >{item.title}</Text>
                <Text className="text-text2 text-xs font-poppins-light">{item.artists?.map(a => a.name).join(", ")}</Text>
              </TouchableOpacity>
            ))}
            
          </View>
    
          <View className="p-4 mt-6">
            <Text className="text-2xl text-text1 font-poppins-semibold">Popular and trending</Text>
          </View>
    
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-4">
            {trendingSongs.map((item, index) => (
              <TouchableOpacity 
                key={index}
                className="w-44 mr-4"
                onPress={async ()=>{
                  await playQueue(trendingSongs, index, {
                    type: "trending",
                    title: "Trending",
                    route: "/(root)/(tabs)/home/listScreen",
                  });
                }}
                >
                <Image source={{uri: item.thumbnail_url}} className="h-44 w-44 rounded-sm"/>
                <Text className="text-text1 text-md font-poppins-semibold mt-2" numberOfLines={2} ellipsizeMode="tail">
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
    
          <View className="p-4 mt-6">
            <Text className="text-text1 text-2xl font-poppins-semibold">Editor's pick</Text>
          </View>
    
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-4">
            {editorsPickSongs.map((item, index) => (
              <TouchableOpacity 
                key={item.id ?? index}
                className="w-44 mr-4"
                onPress={async () => {
                  await playQueue(editorsPickSongs, index, {
                    type: "editorsPick",
                    title: "Editor's Pick",
                    route: "/(root)/(tabs)/home/listScreen",
                  });
                }}  
              >
                <Image source={{uri : item.thumbnail_url}} className="h-44 w-44 rounded-sm"/>
                <Text 
                  className="text-text1 text-md font-poppins-semibold mt-2" 
                  numberOfLines={2} 
                  ellipsizeMode="tail"
                >
                  {item.title}
                </Text>
                <Text className="text-text2 text-xs font-poppins-light">
                  {item.artists?.map((a) => a.name).join(", ")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <View className="p-4 mt-6">
            <Text className="text-text1 text-2xl font-poppins-semibold">Best of artists</Text>
          </View>
    
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-4 mb-16">
            {artists?.map((artist, index) => (
              <TouchableOpacity 
                key={index}
                onPress={()=> router.push({
                  pathname: "/(root)/(tabs)/home/listScreen",
                  params: {
                    type: "artist",
                    title: artist,
                    artist: artist,
                    image: artistImages[artist] || "", 
                    source: "home",
                  }
                })}
                className="mr-4 h-48 w-40 items-center">
                <Image 
                  source={
                    failedImages[artist]
                      ? images.artist
                      : artistImages[artist]
                      ? { uri: artistImages[artist],
                          cache: "force-cache"
                       }
                      : images.artist
                  }
                  style={{tintColor:(failedImages[artist] || !artistImages[artist]) ? "#ffffff" : undefined}}
                  onError={() => {
                    setFailedImages(prev => ({
                      ...prev,
                      [artist]: true,
                    }));
                  }}
                  resizeMode="cover"
                  progressiveRenderingEnabled
                  className="h-40 w-40 rounded-full"
                />
                <Text className="text-text1 text-md font-poppins-semibold mt-2 text-center" numberOfLines={2} ellipsizeMode="tail">
                  {artist}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      );
}
