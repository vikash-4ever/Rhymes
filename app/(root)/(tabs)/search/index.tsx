import icons from "@/constants/icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";

const data = [
  { id: "1", title: "Romantic" },
  { id: "2", title: "Sad Songs" },
  { id: "3", title: "Bollywood" },
  { id: "4", title: "Sufi" },
  { id: "5", title: "Dance" },
  { id: "6", title: "Lofi" },
  { id: "7", title: "Arijit Singh" },
  { id: "8", title: "Atif Aslam" },
  { id: "9", title: "Shreya Ghoshal" },
  { id: "10", title: "Mohit Chauhan" },
  { id: "11", title: "Jubin Nautiyal" },
  { id: "12", title: "Sonu Nigam" },
  { id: "13", title: "Rahat Fateh Ali Khan" },
  { id: "14", title: "Nusrat Fateh Ali Khan" }
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

  const assignedColors = useMemo(() => {
    const shuffled = [...colors];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return data.map((_, index) => shuffled[index]);
  }, []);

  return (
    <View className="flex bg-primary-200 px-4 h-full">
      <Text className="text-white text-4xl font-bold mt-10 mb-6">Search</Text>

      <TouchableOpacity 
        onPress={() => {router.push("/(root)/(tabs)/search/searchScreen")}} 
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
        contentContainerStyle={{paddingBottom: 48}}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                  pathname: "/(root)/(tabs)/search/listScreen",
                  params: {
                      type: "category",
                      category: item.title,
                      title: item.title,
                      color: assignedColors[index],
                      source: "search"
                  },
              })
            }
            className="h-20 px-3 py-2 rounded mb-4 justify-center"
            style={{
              backgroundColor: assignedColors[index],
              width: "48%",
            }}
          >
            <Text className="text-white font-bold text-lg" numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
