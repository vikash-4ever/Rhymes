import icons from "@/constants/icons";
import images from "@/constants/images";
import { getArtistImage, getArtists, getRecentSongs, getTrendingSongs } from "@/lib/api/musicApis";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const {recentlyPlayed} = useGlobalContext();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [recentSongs, setRecentSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);
  const {playQueue} = usePlayer();
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});

  // trying to add local cache for popular & recommendations
  const CACHE_KEY = "HOME_CACHE";
  const CACHE_TTL = 1000 * 60 * 60 * 12;
  //--------------------------------------

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        await AsyncStorage.removeItem("HOME_CACHE");
        const cached = await AsyncStorage.getItem(CACHE_KEY);

        if (cached) {
          const parsed = JSON.parse(cached);
          const isValid = Date.now() - parsed.time < CACHE_TTL;

          if (isValid) {
            setTrendingSongs(parsed.trending);
            setRecentSongs(parsed.recent);
            setArtists(parsed.artists || []);
            setArtistImages(parsed.artistImages || {});
            setLoadingHome(false);
            return;
          }
        }

        const [trendingRes, recentRes, artistsRes] = await Promise.all([
          getTrendingSongs(),
          getRecentSongs(),
          getArtists(),
        ]);

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

        setTrendingSongs(trendingRes || []);
        setRecentSongs(recentRes || []);
        setArtists(topArtists);

        const imagesMap: Record<string, string> = {};

        for(const artist of topArtists) {
          const image = await getArtistImage(artist);
          
          if(image) {
            imagesMap[artist] = image;
          }
        }

        setArtistImages(imagesMap);

        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            time: Date.now(),
            trending: trendingRes || [],
            recent: recentRes || [],
            artists: topArtists,
            artistImages: imagesMap,
          })
        );

      } catch (error) {
        console.log("Home load error", error);
      } finally {
        setLoadingHome(false);
      }
    };

    loadHomeData();
  }, []);

  if (loadingHome) {
  return (
    <View className="flex-1 items-center justify-center bg-primary-200">
      <ActivityIndicator size="large" color="white" />
    </View>
  );
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
            <TouchableOpacity className="items-center" onPress={() => router.push("/(root)/(tabs)/search")}>
              <Text
                className="text-text1 font-poppins-semibold mt-5"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Didn't play any audio! Go to Search.

              </Text>
            </TouchableOpacity>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 ml-4">
              {recentlyPlayed.map((item, index) => (
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
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-44 w-44 rounded-sm"/>
          <Text className="text-text1 text-md font-poppins-semibold mt-2" numberOfLines={2} ellipsizeMode="tail">
            Title
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-44 w-44"/>
          <Text className="text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail">
            Title
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-44 w-44"/>
          <Text className="text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail">
            Title
          </Text>
        </TouchableOpacity>
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
                artistImages[artist]
                  ? { uri: artistImages[artist] }
                  : images.image2
              }
              onError={() => console.log("Image Failed.", artist)}
              resizeMode="cover"
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
