import { useGlobalContext } from "@/lib/global-provider";
import { router } from "expo-router";
import { Modal, Text, TouchableOpacity, View } from "react-native";


export default function GuestSignInModal(){

    const {showGuestModal, exitGuestMode, closeGuestModal} = useGlobalContext();

    return(
        <Modal
            visible={showGuestModal}
            transparent
            animationType="fade"
            onRequestClose={closeGuestModal}
        >
            <TouchableOpacity 
                activeOpacity={1}
                onPress={closeGuestModal}
                className="flex-1 bg-[#00000080] justify-center items-center">
                <TouchableOpacity 
                    activeOpacity={1}
                    onPress={() => {}}
                    className="w-[80%] bg-white items-center rounded-lg py-2">
                    <Text className="text-black text-2xl font-poppins-semibold my-7">You have to Sign In</Text>
                    <Text className="px-8 text-center text-md font-poppins-medium">
                        Sign in to unlock playlists, likes, and sync your music across devices.
                    </Text>

                    <View className="flex-col items-center gap-6 mt-6 mb-4">
                        <TouchableOpacity
                            onPress={async () => {
                                closeGuestModal();
                                await exitGuestMode();
                                router.replace("/login/signIn")
                            }}
                            className="bg-primary-300 rounded-full items-center justify-center"
                        >
                            <Text className="text-white text-lg px-8 py-3 font-poppins-semibold">Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={closeGuestModal}
                            className="py-2"
                        >
                            <Text className="text-black text-lg font-poppins-semibold">Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    )
}