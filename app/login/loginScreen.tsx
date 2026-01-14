import icons from "@/constants/icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  const { method } = useLocalSearchParams<{method?: string}>();

  return (
    <View className="flex flex-1 h-full">
        <LinearGradient 
            colors={["#0f1a2b", "#bdc4d4"]}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, width: "100%" }}
        />
        <View className="absolute top-0 left-0 z-10 w-full">
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="p-5">
                    <Image source={icons.back} tintColor="white" className="size-5"/>
                </TouchableOpacity>
                <Text className="text-white text-lg font-poppins-semibold ml-[30%]">
                    Log in
                </Text>
            </View>

            {method === "phone" ? (
                <View className="flex items-center mt-2 px-5">
                    <View className="flex-row bg-[#ffffff16] w-full rounded-t border-b-[.5px] border-white justify-between items-center p-3">
                        <Text className="text-white text-lg font-poppins-regular ml-2">India</Text>
                        <Image source={icons.down} tintColor={'#ffffff80'} className="size-5 rotate-270"/>
                    </View>
                    <View className="flex-row bg-[#ffffff16] w-full rounded-b">
                        <View className="flex items-center border-r-[.5px] border-white">
                            <Text className="text-white text-lg font-poppins-regular py-3 px-5">+91</Text>
                        </View>
                        <TextInput 
                            placeholder="Phone number" 
                            placeholderTextColor={'#ffffff80'}
                            keyboardType="phone-pad"
                            className="px-4 py-3 text-white text-lg font-poppins-regular ml-2 p-4"
                        />
                    </View>
                    <Text className="text-white text-sm font-poppins-light mt-2">
                        We'll send you a code by SMS to confirm your phone number.
                    </Text>

                    <TouchableOpacity className="bg-white rounded-full items-center mt-12">
                        <Text className="text-[#0f1a2b] font-poppins-semibold py-3 px-8 text-lg">Next</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View className="flex mt-2 px-5">
                    <Text className="text-white font-poppins-semibold mt-8 mb-2">What's your email address?</Text>
                    <TextInput 
                        placeholder="Email" 
                        placeholderTextColor={'#ffffff80'}
                        keyboardType="email-address"
                        className="bg-[#ffffff16] px-4 py-4 rounded text-white"
                    />
                    <Text className="text-white font-poppins-semibold mt-8 mb-2">What's your password?</Text>
                    <TextInput 
                        placeholder="Password"
                        placeholderTextColor={'#ffffff80'} 
                        secureTextEntry 
                        className="bg-[#ffffff16] px-4 py-4 rounded text-white"
                    />
                    <View className="items-center">
                        <TouchableOpacity className="bg-white rounded-full items-center mt-12">
                            <Text className="px-8 py-3 text-[#0f1a2b] text-lg font-poppins-semibold rounded-full">Log in</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="">
                            <Text className="text-white text-lg font-poppins-semibold mt-6">Forgot password?</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    </View>
  );
}
