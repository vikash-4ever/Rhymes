import icons from "@/constants/icons";
import { logoutUser } from "@/lib/auth";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

export default function SettingsScreen() {
    const [showModal, setShowModal] = useState(false);

    const handleClickLogout = () =>{
        setShowModal(true); 
    };

    return(
        <View className="flex bg-primary-200 w-full h-full">
            <View className="flex flex-row bg-primary-300">
                <TouchableOpacity onPress={() => router.back()} className="justify-center items-center">
                    <Image source={icons.back} tintColor={'white'} className="size-5 m-6"/>
                </TouchableOpacity>
                <View className="justify-center">
                    <Text className="text-white text-lg font-poppins-semibold py-4 ml-[40%]">
                        Settings
                    </Text>
                </View>
            </View>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-regular">
                    Mobile Data
                </Text>
                <Text className="text-sm text-gray-400">
                    4 MB used by Spotify Lite this month
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-regular">
                    Storage
                </Text>
                <Text className="text-sm text-gray-400">
                    57 MB used by Spotify Lite
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-regular">
                    Audio Settings
                </Text>
                <Text className="text-sm text-gray-400">
                    Audio Quality: Basic
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-regular">
                    Download Settings
                </Text>
                <Text className="text-sm text-gray-400">
                    Downloading on Wi-Fi only
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-regular">
                    Privacy Settings
                </Text>
                <Text className="text-sm text-gray-400">
                    Manage sharing your listening activity
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-regular">
                    About
                </Text>
                <Text className="text-sm text-gray-400 font-poppins-regular">
                    Rhymes v1.0.0
                </Text>
            </TouchableOpacity>
            <View className="border-t border-gray-400 mx-5 mt-10 pt-10">
                <TouchableOpacity className="flex flex-row items-center py-4 gap-4">
                    <Image source={icons.logo} tintColor={'white'} className="size-7"/>
                    <Text className="text-white text-lg font-poppins-semibold">Rhymes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClickLogout} className="flex flex-row items-center py-4 gap-4">
                    <Image source={icons.logout} tintColor={'white'} className="size-7"/>
                    <Text className="text-white text-lg font-poppins-semibold">Logout</Text>
                </TouchableOpacity>
            </View>
             <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowModal(false)}
            >
                <View className="flex h-full bg-[#00000008] justify-center items-center">
                    <View className="flex w-[80%] bg-white items-center rounded-lg py-2">
                        <Text className="text-black text-2xl font-poppins-semibold my-7">Log out</Text>
                        <Text className="px-8 text-center text-md font-poppins-medium">Are you sure you want to logout of Rhymes?</Text>

                        <View className="flex-col items-center gap-6 mt-6 mb-4">
                        <TouchableOpacity
                            onPress={logoutUser}
                            className="bg-primary-300 rounded-full items-center justify-center"
                        >
                            <Text className="text-white text-lg px-8 py-3 font-poppins-semibold">Log out</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setShowModal(false)}
                            className="py-2"
                        >
                            <Text className="text-black text-lg font-poppins-semibold">Cancel</Text>
                        </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}