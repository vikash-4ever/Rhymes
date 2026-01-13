import icons from "@/constants/icons";
import { router } from "expo-router";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

const data = [
  { id: "1", title: "Music" },
  { id: "2", title: "Podcast" },
  { id: "3", title: "New Releases" },
  { id: "4", title: "Rain & Monsoon" },
  { id: "5", title: "Chill Vibes" },
  { id: "6", title: "Workout" },
  { id: "7", title: "Focus" },
  { id: "8", title: "Sleep" },
  { id: "9", title: "Travel" },
  { id: "10", title: "Party" },
  { id: "11", title: "Romantic" },
  { id: "12", title: "Classical" },
  { id: "13", title: "Jazz" },
  { id: "14", title: "Rock" },
  { id: "15", title: "Hip Hop" },
  { id: "16", title: "Indie" },
  { id: "17", title: "Electronic" },
  { id: "18", title: "Acoustic" },
  { id: "19", title: "Instrumental with rain effects" },
  { id: "20", title: "Meditation" },
  { id: "21", title: "Lofi" },
  { id: "22", title: "Bollywood" },
  { id: "23", title: "Hollywood" },
  { id: "24", title: "Devotional" },
  { id: "25", title: "Trending Now" },
  { id: "26", title: "Top 50" },
  { id: "27", title: "Throwback" },
  { id: "28", title: "Summer Hits" },
  { id: "29", title: "Winter Chill" },
  { id: "30", title: "Study Beats" },
  { id: "31", title: "Motivation" },
  { id: "32", title: "Happy Mood" },
  { id: "33", title: "Sad Songs" },
  { id: "34", title: "Road Trip" },
  { id: "35", title: "Dance" },
  { id: "36", title: "Kids" },
  { id: "37", title: "News & Talk" },
  { id: "38", title: "Comedy" },
  { id: "39", title: "Horror Stories" },
  { id: "40", title: "Nature Sounds" },
];

const colors = [
  "#734f96", // purple
  "#1DB954", // green
  "#FF4C4C", // red
  "#FFB347", // orange
  "#4FC3F7", // blue
  "#FFD700", // yellow
  "#E91E63", // pink
  "#9C27B0", // violet
  "#00BCD4", // cyan
  "#8BC34A", // light green
  "#FF9800", // deep orange
  "#03A9F4", // sky blue
  "#673AB7", // deep purple
  "#C2185B", // rose
  "#607D8B", // blue gray
  "#CDDC39", // lime
  "#F44336", // crimson
  "#009688", // teal
  "#795548", // brown
  "#90CAF9", // pastel blue
];

export default function Search() {

  const assignedColors = data.map(() => 
    colors[Math.floor(Math.random() * colors.length)]
  );

  return (
    <View className="flex bg-primary-200 px-4 h-full">
      <Text className="text-white text-4xl font-bold mt-10 mb-6">Search</Text>

      <TouchableOpacity 
        onPress={() => {router.push("/searchScreen")}} 
        className="flex-row items-center bg-white h-16 rounded px-3 mb-4" 
        activeOpacity={0.8}
      >
        <Image source={icons.search} className="h-7 w-7 ml-5 mr-2" />
        <Text className="flex-1 text-lg text-black">Search songs or paste any link</Text>
      </TouchableOpacity>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View
            className="h-20 px-3 py-2 rounded mb-4 justify-center"
            style={{
              backgroundColor: assignedColors[index],
              width: "48%",
            }}
          >
            <Text className="text-white font-bold text-lg" numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
