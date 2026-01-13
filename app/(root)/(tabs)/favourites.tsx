import icons from "@/constants/icons";
import { useRouter } from "expo-router";
import { Route } from "expo-router/build/Route";
import * as React from "react";
import { Image, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";

type Route = { key: string; title: string };

const PlaylistsRoute = () => {
  const router = useRouter();

  return (
    <View className="flex-1 gap-2 bg-primary-200 p-4">
      <View className="flex flex-row p-2 items-center">
        <Image source={icons.sort} tintColor={"#6f7684"} className="h-4 w-4" />
        <Text className="text-text1 text-sm ml-2">Alphabetical</Text>
      </View>

      <View className="flex flex-row mt-2 items-center">
        <View className="bg-gray-500 h-14 w-14 items-center justify-center">
          <Image source={icons.add} tintColor={"white"} className="size-5" />
        </View>
        <Text className="text-text1 font-medium ml-4">Create Playlist</Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/localAudio")}
        className="flex flex-row mt-2 items-center"
      >
        <View className="bg-gray-500 h-14 w-14 items-center justify-center">
          <Image source={icons.disk} tintColor={"white"} className="size-7" />
        </View>
        <Text className="text-text1 font-medium ml-4">Local Audio Files</Text>
      </TouchableOpacity>
    </View>
  );
};

const ArtistsRoute = () => (
  <View className="flex-1 bg-primary-200 items-center justify-center">
    <Text className="text-white">Your Artists</Text>
  </View>
);

const AlbumsRoute = () => (
  <View className="flex-1 bg-primary-200 items-center justify-center">
    <Text className="text-white">Your Albums</Text>
  </View>
);

const PodcastsRoute = () => (
  <View className="flex-1 bg-primary-200 items-center justify-center">
    <Text className="text-white">Your Podcasts</Text>
  </View>
);

export default function Favourites() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  const [routes] = React.useState<Route[]>([
    { key: "playlists", title: "Playlists" },
    { key: "artists", title: "Artists" },
    { key: "albums", title: "Albums" },
    { key: "podcasts", title: "Podcasts" },
  ]);

  const renderScene = SceneMap({
    playlists: PlaylistsRoute,
    artists: ArtistsRoute,
    albums: AlbumsRoute,
    podcasts: PodcastsRoute,
  });

  return (
    <TabView
      navigationState={{index, routes}}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{width: layout.width}}  
      renderTabBar={(props) => (
        <TabBar
          {...(props as any)}
          style={{backgroundColor:'#232323'}}
          indicatorStyle={{backgroundColor:'white'}}
          tabStyle={{width: layout.width / routes.length}}
          contentContainerStyle={{flex:1, justifyContent:'space-between'}}
          renderLabel={({route, focused} : {route: Route; focused: boolean}) => (
            <Text className={focused ? "text-white font-semibold" : "primary-100"}>
              {route.title}
            </Text>
          )}
        />
      )} 
    />

  );
}
