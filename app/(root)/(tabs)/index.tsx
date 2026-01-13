import icons from "@/constants/icons";
import images from "@/constants/images";
import { useGlobalContext } from "@/lib/global-provider";
import { getPopularSongs, getRecommendations, SongItem } from "@/lib/songsApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const {recentlyPlayed} = useGlobalContext();
  const [popularSongs, setPopularSongs] = useState<SongItem[]>([]);
  const [recommendedSongs, setRecommendedSongs] = useState<SongItem[]>([]);
  const [loadingHome, setLoadingHome] = useState(true);

  // trying to add local cache for popular & recommendations
  const CACHE_KEY = "HOME_CACHE";
  const CACHE_TTL = 1000 * 60 * 60 * 12;
  //--------------------------------------

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        
        if (cached) {
          const parsed = JSON.parse(cached);
          const isValid = Date.now() - parsed.time < CACHE_TTL;

          if (isValid) {
            setPopularSongs(parsed.popular);
            setRecommendedSongs(parsed.recommended);
            setLoadingHome(false);
            return;
          }
        }

        const [popularRes, recRes] = await Promise.all([
          getPopularSongs(),
          getRecommendations(),
        ]);

        setPopularSongs(popularRes.results || []);
        setRecommendedSongs(recRes.results || []);

        await AsyncStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            time: Date.now(),
            popular: popularRes.results || [],
            recommended: recRes.results || [],
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


  return (
    <ScrollView className="flex flex-1 h-full bg-primary-200" showsVerticalScrollIndicator={false}>
      <View className="flex-1 flex-row justify-between items-center p-4 ">
        <Text className="text-2xl font-bold text-text1">
          Recently Played
        </Text>
        <TouchableOpacity onPress={()=> router.push("/(root)/settingsScreen")}>
          <Image source={icons.setting} tintColor={"white"} className="size-7"/>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4 ml-4">
        {recentlyPlayed.length === 0 ? (
          <TouchableOpacity 
            className="mr-4"
            activeOpacity={0.7}
          >
            <Image source={images.image3} className="h-32 w-32 rounded-sm"/>
            <Text
              className="text-text1 font-bold mt-2"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Empty List
            </Text>
          </TouchableOpacity>
        ) : (
          recentlyPlayed.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="mr-4"
              onPress={() => router.push({ pathname: "/searchResult", params: { result: JSON.stringify(item) } })}
            >
              <Image
                source={item.thumbnail ? { uri: item.thumbnail } : require("@/constants/images").image1}
                className="h-32 w-32 rounded-sm"
              />
              <Text className="text-text1 font-bold w-32 mt-2" numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
            </TouchableOpacity>
          ))
        )}
        
      </ScrollView>

      <View className="flex flex-row p-4 mt-6 items-center">
        <Text className="text-2xl text-text1 font-bold ">Made for you</Text>
      </View>

      <View className="flex-row justify-between pl-4 pr-6">
        {recommendedSongs.slice(0, 2).map((item, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={() => router.push({
              pathname: "/searchResult",
              params: {result: JSON.stringify(item)}
            })} 
            className="w-44 mr-4"
          >
            <Image source={{uri: item.thumbnail}} className="h-44 w-44 rounded-sm"/>
            <Text className=" text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail" >{item.title}</Text>
            <Text className="text-text2 text-xs">{item.artist}</Text>
          </TouchableOpacity>
        ))}
        
      </View>

      <View className="p-4 mt-6">
        <Text className="text-2xl text-text1 font-bold">Popular and trending</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-4">
        {popularSongs.map((item, index) => (
          <TouchableOpacity 
            key={index}
            className="w-44 mr-4"
            onPress={()=> router.push({
              pathname: "/searchResult",
              params: {result: JSON.stringify(item)}
            })}
            >
            <Image source={{uri: item.thumbnail}} className="h-44 w-44 rounded-sm"/>
            <Text className="text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail">
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View className="p-4 mt-6">
        <Text className="text-text1 text-2xl font-bold">Editor's pick</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-4">
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-44 w-44 rounded-sm"/>
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
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-44 w-44"/>
          <Text className="text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail">
            Title
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View className="p-4 mt-6">
        <Text className="text-text1 text-2xl font-bold">Best of artists</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="ml-4 mb-16">
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-40 w-40 rounded-sm"/>
          <Text className="text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail">
            Title
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-40 w-40"/>
          <Text className="text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail">
            Title
          </Text>
        </TouchableOpacity>
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-40 w-40"/>
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
        <TouchableOpacity className="mr-4">
          <Image source={images.image1} className="h-44 w-44"/>
          <Text className="text-text1 text-md font-bold mt-2" numberOfLines={2} ellipsizeMode="tail">
            Title
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScrollView>
  );
}
