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

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.35, 1]),
  }));

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

function SongRow({
  imageSize,
  count,
}: {
  imageSize: number;
  count: number;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 18 }}
    >
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            width: imageSize,
            marginRight: 16,
          }}
        >
          <ShimmerBox
            width={imageSize}
            height={imageSize}
          />

          <View style={{ marginTop: 10 }}>
            <ShimmerBox
              width={imageSize * 0.8}
              height={16}
            />
          </View>

          <View style={{ marginTop: 6 }}>
            <ShimmerBox
              width={imageSize * 0.6}
              height={12}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

export default function HomeSkeleton() {
  return (
    <ScrollView
      className="flex-1 bg-primary-200"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}

      <View
        style={{
          paddingHorizontal: 16,
          marginTop: 18,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <ShimmerBox
          width={210}
          height={30}
        />

        <ShimmerBox
          width={34}
          height={34}
          borderRadius={17}
        />
      </View>

      {/* Recently Played */}

      <View style={{ paddingHorizontal: 16, marginTop: 28 }}>
        <ShimmerBox width={170} height={28} />

        <SongRow imageSize={128} count={3} />
      </View>

      {/* Made for You */}

      <View style={{ paddingHorizontal: 16, marginTop: 34 }}>
        <ShimmerBox width={160} height={28} />

        <SongRow imageSize={176} count={3} />
      </View>

      {/* Popular & Trending */}

      <View style={{ paddingHorizontal: 16, marginTop: 34 }}>
        <ShimmerBox width={200} height={28} />

        <SongRow imageSize={176} count={3} />
      </View>

      {/* Editor's Pick */}

      <View style={{ paddingHorizontal: 16, marginTop: 34 }}>
        <ShimmerBox width={170} height={28} />

        <SongRow imageSize={176} count={3} />
      </View>

      {/* Best of Artists */}

      <View
        style={{
          paddingHorizontal: 16,
          marginTop: 34,
          marginBottom: 40,
        }}
      >
        <ShimmerBox width={170} height={28} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 20 }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <View
              key={index}
              style={{
                alignItems: "center",
                marginRight: 20,
                width: 140,
              }}
            >
              <ShimmerBox
                width={140}
                height={140}
                borderRadius={70}
              />

              <View style={{ marginTop: 12 }}>
                <ShimmerBox
                  width={90}
                  height={15}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}