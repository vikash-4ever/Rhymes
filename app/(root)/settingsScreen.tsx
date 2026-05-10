import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { router } from "expo-router";
import { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

type AppUser = {
    email?: string;
    name?: string;
    isGuest?: boolean;
} | null;

export default function SettingsScreen() {
    const {user, logout} = useGlobalContext();
    const appUser = user as unknown as AppUser;
    const [showModal, setShowModal] = useState(false);
    const {resetPlayer} = usePlayer();

    const handleClickLogout = () =>{
        setShowModal(true); 
    };

    const handleLogout = async () => {
        try{
            setShowModal(false);
            await resetPlayer();
            await logout();
        } catch (error) {
            console.log("Logout Error : ", error);
        }
    }

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
                <Text className="text-white text-lg font-poppins-medium">
                    Account
                </Text>
                <Text className="text-sm font-poppins-light text-gray-400">
                    {appUser?.name || appUser?.email || "Guest"}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-medium">
                    Mobile Data
                </Text>
                <Text className="text-sm font-poppins-light text-gray-400">
                    4 MB used by Rhymes this month
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-medium">
                    Storage
                </Text>
                <Text className="text-sm font-poppins-light text-gray-400">
                    57 MB used by Rhymes
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-medium">
                    Audio Settings
                </Text>
                <Text className="text-sm font-poppins-light text-gray-400">
                    Audio Quality: Auto
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-medium">
                    Download Settings
                </Text>
                <Text className="text-sm font-poppins-light text-gray-400">
                    Downloading on Wi-Fi only
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-medium">
                    Privacy Settings
                </Text>
                <Text className="text-sm font-poppins-light text-gray-400">
                    Manage sharing your listening activity
                </Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex w-full px-5 py-3">
                <Text className="text-white text-lg font-poppins-medium">
                    About
                </Text>
                <Text className="text-sm font-poppins-light text-gray-400">
                    Rhymes v1.0.0
                </Text>
            </TouchableOpacity>
            <View className="border-t border-gray-400 mx-5 mt-10 pt-10">
                <TouchableOpacity className="flex flex-row items-center py-4 gap-4">
                    <Image source={icons.logo} tintColor={'white'} className="size-7"/>
                    <Text className="text-white text-lg font-poppins-semibold">Rhymes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClickLogout} className="flex flex-row items-center py-4 gap-4">
                    <Image source={icons.logout} tintColor={'red'} className="size-7"/>
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
                            onPress={handleLogout}
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