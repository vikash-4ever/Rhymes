import MiniPlayer from "@/components/MiniPlayer";
import icons from "@/constants/icons";
import { usePlayer } from "@/lib/PlayerContext";
import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

const TabIcon = ({ focused, icon, title} : {focused: boolean; icon: any; title: string}) => (
    <View className="flex flex-1 flex-col items-center">
        <Image source={icon} tintColor={focused ? 'white' : '#6f7684'} resizeMode="contain" className="size-7"/>
        <Text className={`${focused ? 'text-white' : 'text-primary-100'} text-xs w-full text-center mt-2`}>
            {title}
        </Text>
    </View>
)

const AppTabs = () => {
  const {currentTrack, isPlaying } = usePlayer();

    return(
      <View className="flex-1 bg-black">
        <Tabs screenOptions={{ tabBarShowLabel: false, tabBarStyle: { backgroundColor: "#232323", height:56, borderTopColor:'black'} }}>
          <Tabs.Screen name="index" options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon icon={focused ? icons.homeFilled : icons.home} focused={focused} title="Home"/>
          }}/>
          <Tabs.Screen name="search" options={{
            title: 'Search',
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon icon={focused ? icons.searchFilled : icons.search} focused={focused} title="Search"/>
          }}/>
          <Tabs.Screen name="favourites" options={{
            title: 'Favourites',
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon icon={focused ? icons.heartFilled: icons.heart} focused={focused} title="Favourites"/>
          }}/>
          <Tabs.Screen name="localAudio" options={{
            href: null,
            headerShown: false,
          }}/>
          <Tabs.Screen name="searchScreen" options={{
            href: null,
            headerShown: false,
          }}/>
          <Tabs.Screen name="searchResult" options={{
            href: null,
            headerShown: false,
          }}/>
        </Tabs>

        {currentTrack && (
          <View className="absolute bottom-16 left-0 right-0 z-50">
            <MiniPlayer/>
          </View>
        )}
      </View>
    )
};

export default AppTabs;