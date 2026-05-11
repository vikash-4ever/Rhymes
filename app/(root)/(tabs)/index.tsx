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
  const {recentlyPlayed, artistImages, loadArtistImage, setArtistImages} = useGlobalContext();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const {playQueue} = usePlayer();
  const [editorsPickSongs, setEditorsPickSongs] = useState<Song[]>([]);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // trying to add local cache for popular & recommendations
  const CACHE_KEY = "HOME_CACHE";
  const CACHE_TTL = 1000 * 60 * 60 * 12;
  //--------------------------------------

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

              return;
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
          .sort((a, b) => b[1] - a[1]) // descending
          .slice(0, 15) // only top 10-15
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
            <Text className="text-2xl font-poppins-semibold text-text1">
              Recently Played
            </Text>
            <TouchableOpacity onPress={()=> router.push("/(root)/settingsScreen")} className="h-14 w-14 items-center justify-center">
              <Image source={icons.setting} tintColor={"white"} className="size-7"/>
            </TouchableOpacity>
          </View>
          {recentlyPlayed.length === 0 ? (
                <TouchableOpacity className="items-center justify-center h-16" onPress={() => router.push("/(root)/(tabs)/search")}>
                  <Text
                    className="text-text1 font-poppins-semibold"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Didn't play any audio! Go to Search.
    
                  </Text>
                </TouchableOpacity>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 ml-4">
                  {recentlyPlayed.filter(Boolean).map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      className="mr-4"
                      onPress={async() => {
                        await playQueue(recentlyPlayed, index);
                        router.push("/playingScreen");
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
            )
          }
    
          <View className="flex flex-row p-4 mt-6 items-center">
            <Text className="text-2xl text-text1 font-poppins-semibold ">Made for you</Text>
          </View>
    
          <View className="flex-row justify-between pl-4 pr-6">
            {recentSongs.slice(0, 2).map((item, index) => (
              <TouchableOpacity 
                key={index} 
                onPress={async () => {
                  await playQueue(recentSongs, index);
                  router.push("/playingScreen");
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
                  await playQueue(trendingSongs, index);
                  router.push("/playingScreen");
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
                  await playQueue(editorsPickSongs, index);
                  router.push("/playingScreen");
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
                  pathname: "/favouriteSongs",
                  params: {
                    type: "artist",
                    title: artist,
                    artist: artist,
                    image: artistImages[artist] || "", 
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
