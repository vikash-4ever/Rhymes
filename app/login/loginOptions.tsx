import icons from "@/constants/icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function LoginOptions() {
    return(
        <View className="flex flex-1 h-full">
            <LinearGradient 
                colors={["#0f1a2b", "#bdc4d4"]}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, width: "100%" }}
            />
            <View className="absolute top-0 left-0 z-10 w-full">
                <TouchableOpacity onPress={() => router.back()} className="p-5">
                    <Image source={icons.back} tintColor={'white'} className="size-5"/>
                </TouchableOpacity>
                <View className="flex items-center mt-[65%] px-8 gap-5">
                    <Text className="text-xl text-white font-poppins-semibold">Log in with</Text>
                    <TouchableOpacity onPress={() => router.push("/login/loginScreen?method=phone")} className="bg-primary-300 flex-row w-full rounded-full py-3 justify-center items-center gap-4">
                        <Image source={icons.phone} tintColor={'white'} className="size-6"/>
                        <Text className="text-white text-lg font-poppins-semibold">Phone number</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push("/login/loginScreen?method=email")} className="bg-white flex-row w-full rounded-full py-3 justify-center items-center gap-4">
                        <Image source={icons.email} tintColor={'black'} className="size-6"/>
                        <Text className="text-black text-lg font-poppins-semibold">Email</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    )
}