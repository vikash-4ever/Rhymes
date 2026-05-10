import { useEffect } from "react";
import { ScrollView, View } from "react-native";
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

function ShimmerBox({
  width,
  height,
  borderRadius = 8,
}: {
  width: number;
  height: number;
  borderRadius?: number;
}) {

  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmer.value,
      [0, 1],
      [0.35, 1]
    );

    return {
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#2A2A2A",
        },
        animatedStyle,
      ]}
    />
  );
}

export default function HomeSkeleton() {

  return (
    <ScrollView
      className="flex-1 bg-primary-200"
      showsVerticalScrollIndicator={false}
    >

      {/* Recently Played */}

      <View className="px-4 mt-5">

        <ShimmerBox
          width={180}
          height={30}
        />

        <View
          style={{
            flexDirection: "row",
            marginTop: 20,
          }}
        >

          {[1,2,3].map((i) => (
            <View key={i} style={{ marginRight: 16 }}>
              <ShimmerBox
                width={130}
                height={130}
              />

              <View style={{ marginTop: 10 }}>
                <ShimmerBox
                  width={100}
                  height={15}
                />
              </View>
            </View>
          ))}

        </View>

      </View>

      {/* Made for you */}

      <View className="px-4 mt-10">

        <ShimmerBox
          width={160}
          height={30}
        />

        <View
          style={{
            flexDirection: "row",
            marginTop: 20,
          }}
        >

          {[1,2].map((i) => (
            <View key={i} style={{ marginRight: 16 }}>
              <ShimmerBox
                width={170}
                height={220}
              />

              <View style={{ marginTop: 10 }}>
                <ShimmerBox
                  width={120}
                  height={15}
                />
              </View>
            </View>
          ))}

        </View>

      </View>

    </ScrollView>
  );
}