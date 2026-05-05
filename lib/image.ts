import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

export const uploadToCloudinary = async (imageUri: string) => {
    const data = new FormData();

    data.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "thumbnail.jpg",
    } as any);

    data.append("upload_preset", "playlist_thumbnails"); // 👈 required

    const res = await fetch(
        "https://api.cloudinary.com/v1_1/vikash-4ever/image/upload",
        {
        method: "POST",
        body: data,
        }
    );

    const json = await res.json();
    return json.secure_url;
};


export const pickAndCompressImage = async () => {

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
        alert("Permission required");
        return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
    });

    if (res.canceled) return null;

    // ✅ Compress
    const compressed = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 500 } }],
        {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        }
    );
    return compressed.uri;
};