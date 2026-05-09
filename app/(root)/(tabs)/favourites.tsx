import icons from "@/constants/icons";
import { createPlaylist, deletePlaylist, renamePlaylist, updatePlaylistThumbnail } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";
import { pickAndCompressImage, uploadToCloudinary } from "@/lib/image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Route } from "expo-router/build/Route";
import * as React from "react";
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { TabBar, TabView } from "react-native-tab-view";

type Route = { key: string; title: string };

const PlaylistsRoute = () => {
  const router = useRouter();
  const {user, loadPlaylists, likedSongs, loading, likesLoading, playlists} = useGlobalContext();
  console.log(likedSongs.length, "Liked Songs");
  const [showModal, setShowModal] = React.useState(false);
  const [playListName, setPlayListName] = React.useState("");
  const [optionsModal, setOptionsModal] = React.useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<any>(null);
  const [renameModal, setRenameModal] = React.useState(false);
  const [newName, setNewName] = React.useState("");

  const handleCreatePlaylist = async () => {
    if (!playListName.trim() || !user) return;

    try {
      await createPlaylist(user.$id, playListName.trim());
      setPlayListName("");
      setShowModal(false);
      await loadPlaylists();
    } catch (error) {
      console.log("Create Playlist Error :", error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      await deletePlaylist(playlistId);
      await loadPlaylists();
    } catch (error) {
      console.log("Delete Playlist Error:", error);
    }
  };

  const handleThumbnailUpdate = async () => {
  if (!selectedPlaylist?.$id) return;

  const compressedUri = await pickAndCompressImage();
  if (!compressedUri) return;

  const imageUrl = await uploadToCloudinary(compressedUri);

  await updatePlaylistThumbnail(selectedPlaylist.$id, imageUrl);
  await loadPlaylists();

  setOptionsModal(false);
  setSelectedPlaylist(null);
};

  if (loading || likesLoading) {
    return(
      <View className="flex-1 items-center justify-center bg-black">
        <ActivityIndicator color={"white"}/>
      </View>
    );
  }
  return (
    <>
    <View className="flex-1 gap-2 bg-primary-200 p-4">
      <ScrollView 
        className="flex-1 bg-primary-200"
        contentContainerStyle={{padding: 6, paddingBottom: 100, gap: 5}}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex flex-row p-2 items-center">
          <Image source={icons.sort} tintColor={"#6f7684"} className="h-4 w-4" />
          <Text className="text-text1 font-poppins-light text-xs ml-2">Alphabetical</Text>
        </View>

        <TouchableOpacity onPress={() => setShowModal(true)} className="flex flex-row mt-2 items-center">
          <View className="bg-[#ffffff30] h-14 w-14 items-center justify-center">
            <Image source={icons.add} tintColor={"white"} className="size-5" />
          </View>
          <Text className="text-text1 font-poppins-medium text-lg ml-4">Create Playlist</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push({
            pathname: "/favouriteSongs",
            params: {
              type: "liked",
              title: "Favourite Songs"
            }
          })}
          className="flex flex-row mt-2 items-center">
          <View className="bg-gray-400 h-14 w-14 items-center justify-center">
            <LinearGradient
              colors={["#bdc4d4", "#3f3a9b"]}
              start={{ x: 0.1, y: 0.1 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, width: "100%" }}
            />
            <Image source={icons.heartFilled} tintColor={"white"} className="absolute size-6"/>
          </View>
          <View className="pl-4 justify-center">
            <Text className="text-text1 font-poppins-medium text-lg">Favourite Songs</Text>
            <Text className="text-text2">{likedSongs.length} Songs</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push({
            pathname: "/favouriteSongs",
            params: {
              type: "local",
              title: "Local Audio Files",
            }
          })}
          className="flex flex-row mt-2 items-center"
        >
          <View className="bg-gray-500 h-14 w-14 items-center justify-center">
            <Image source={icons.disk} tintColor={"white"} className="size-7" />
          </View>
          <View className="pl-4 justify-center">
            <Text className="text-text1 font-poppins-medium text-lg">Local Audio Files</Text>
            <Text className="text-text2">156 Songs</Text>
          </View>
        </TouchableOpacity>

        {playlists.length > 0 && (
          <>
            {playlists.map((playlist) => (
              <TouchableOpacity
                key={playlist.$id}
                onPress={() => router.push({
                  pathname: "/favouriteSongs",
                  params: {
                    type: "playlist",
                    id: playlist.$id,
                    title: playlist.name
                  }
                })}
                onLongPress={() => {
                  setSelectedPlaylist(playlist);
                  setOptionsModal(true);
                }}
                delayLongPress={100}
                className="flex flex-row mt-2 items-center"
              >
                <View className="bg-gray-700 h-14 w-14 items-center justify-center">
                  <Image source={playlist.coverImage ? {uri: playlist.coverImage} : icons.disk} className="size-14" />
                </View>

                <View className="pl-4 justify-center">
                  <Text className="text-text1 font-poppins-medium text-lg">
                    {playlist.name}
                  </Text>
                  <Text className="text-text2">
                    {playlist.songIds?.length || 0} Songs
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>

    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowModal(false)}
    >
      <View className="flex h-full bg-[#00000008] justify-center items-center">
        
        <View className="flex w-[80%] bg-white items-center rounded-lg py-4 px-4">
          
          <Text className="text-black text-2xl font-poppins-semibold my-4">
            Create Playlist
          </Text>

          <TextInput
            placeholder="Enter playlist name"
            placeholderTextColor="#9ca3af"
            value={playListName}
            onChangeText={setPlayListName}
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-black mt-2"
          />

          <View className="flex-col items-center gap-4 mt-6 mb-2 w-full">

            <TouchableOpacity
              onPress={handleCreatePlaylist}
              disabled={!playListName.trim()}
              className={`w-full rounded-full items-center justify-center ${
                playListName.trim() ? "bg-primary-300" : "bg-gray-600"
              }`}
            >
              <Text className="text-white text-lg px-8 py-3 font-poppins-semibold">
                Create
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                setPlayListName("");
              }}
              className="p-2"
            >
              <Text className="text-black text-lg font-poppins-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

          </View>

        </View>

      </View>
    </Modal>

    <Modal
      visible={optionsModal}
      transparent
      animationType="fade"
      onRequestClose={() => {
        setOptionsModal(false);
        setSelectedPlaylist(null);
        setNewName("");
      }}
    >
      <TouchableOpacity 
        activeOpacity={1}
        onPress={() => {
          setOptionsModal(false);
          setSelectedPlaylist(null);
          setNewName("");
        }}
        className="flex-1 justify-end bg-[#00000080]"
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => {}}
          className="bg-[#000000cc] rounded-t-2xl px-6 py-6"
        >
          <Text className="text-white text-xl self-center font-poppins-semibold mb-4">
            {selectedPlaylist?.name}
          </Text>

          {/* DELETE */}
          <TouchableOpacity
            onPress={async () => {
              await handleDeletePlaylist(selectedPlaylist?.$id);
              setOptionsModal(false);
              setSelectedPlaylist(null);
              setNewName("");
            }}
            className="py-3"
          >
            <Text className="text-red-500 text-lg font-poppins-medium">
              Delete
            </Text>
          </TouchableOpacity>

          {/* RENAME */}
          <TouchableOpacity
            onPress={() => {
              if(!selectedPlaylist) return;
              setOptionsModal(false);
              setRenameModal(true);
              setNewName(selectedPlaylist?.name || "");
            }}
            className="py-3"
          >
            <Text className="text-white text-lg font-poppins-medium">Rename</Text>
          </TouchableOpacity>

          {/* PIN */}
          <TouchableOpacity
            onPress={() => {
              setOptionsModal(false);
            }}
            className="py-3"
          >
            <Text className="text-white text-lg font-poppins-medium">Pin to top</Text>
          </TouchableOpacity>

          {/* SHARE */}
          <TouchableOpacity
            onPress={() => {
              setOptionsModal(false);
            }}
            className="py-3"
          >
            <Text className="text-white text-lg font-poppins-medium">Share</Text>
          </TouchableOpacity>

          {/* THUMBNAIL */}
          <TouchableOpacity
            onPress={async () => {
              if (!selectedPlaylist?.$id) return;

              const uri = await pickAndCompressImage();
              if (!uri) return;

              const imageUrl = await uploadToCloudinary(uri);

              await updatePlaylistThumbnail(selectedPlaylist.$id, imageUrl);
              await loadPlaylists();

              setOptionsModal(false);
            }}
            className="py-3"
          >
            <Text className="text-white text-lg font-poppins-medium">Edit Thumbnail</Text>
          </TouchableOpacity>

          {/* CANCEL */}
          <TouchableOpacity
            onPress={() => {
              setOptionsModal(false);
              setSelectedPlaylist(null);
              setNewName("");

            }}
            className="py-4 mt-2"
          >
            <Text className="text-center text-gray-500 text-lg font-poppins-medium">
              Cancel
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
    <Modal visible={renameModal}
      transparent
      onRequestClose={() => {
        setRenameModal(false);
        setSelectedPlaylist(null);
        setNewName("");
      }}
    >
      <View className="flex h-full justify-center items-center bg-black/50">
        <View className="flex w-[80%] bg-white items-center rounded-lg py-4 px-4">
  
          <Text className="text-black text-2xl font-poppins-semibold my-4">
            Rename Playlist
          </Text>

          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Enter playlist name"
            placeholderTextColor="#9ca3af"
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-black mt-2"
          />

          <View className="flex-col items-center gap-4 mt-6 mb-2 w-full">

            <TouchableOpacity
              onPress={async () => {
                if(!selectedPlaylist?.$id || !newName.trim()) return;
                
                await renamePlaylist(selectedPlaylist.$id, newName.trim());
                await loadPlaylists();

                setRenameModal(false);
                setOptionsModal(false);
                setSelectedPlaylist(null);
                setNewName("");
              }}
              disabled={!newName.trim()}
              className={`w-full rounded-full items-center justify-center ${
                newName.trim() ? "bg-primary-300" : "bg-gray-600"
              }`}
            >
              <Text className="text-white text-lg px-8 py-3 font-poppins-semibold">
                Save
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setRenameModal(false);
                setSelectedPlaylist(null);
                setNewName("");
              }}
              className="p-2"
            >
              <Text className="text-black text-lg font-poppins-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

          </View>

        </View>
      </View>
    </Modal>
    </>
  );
};

const ArtistsRoute = () => (
  <View className="flex-1 bg-primary-200 items-center justify-center">
    <Text className="text-white">Your Artists</Text>
  </View>
);

const AlbumsRoute = () => (
  <View className="flex-1 bg-primary-200 items-center justify-center">
    <Text className="text-white">Your Albums</Text>
  </View>
);

const PodcastsRoute = () => (
  <View className="flex-1 bg-primary-200 items-center justify-center">
    <Text className="text-white">Your Podcasts</Text>
  </View>
);

export default function Favourites() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  const [routes] = React.useState<Route[]>([
    { key: "playlists", title: "Playlists" },
    { key: "artists", title: "Artists" },
    { key: "albums", title: "Albums" },
    { key: "podcasts", title: "Podcasts" },
  ]);

  const renderScene = ({route} : {route: Route}) =>  {
    switch(route.key) {
      case "playlists":
        return <PlaylistsRoute/>;
      case "artists":
        return <ArtistsRoute/>;
      case "albums":
        return <AlbumsRoute/>;
      case "podcasts":
        return <PodcastsRoute/>
        default:
          return null;
    }
  };

  return (
    <TabView
      navigationState={{index, routes}}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{width: layout.width}}  
      renderTabBar={(props) => (
        <TabBar
          {...(props as any)}
          style={{backgroundColor:'#000000'}}
          indicatorStyle={{backgroundColor:'white'}}
          tabStyle={{width: layout.width / routes.length}}
          contentContainerStyle={{flex:1, justifyContent:'space-between'}}
          renderLabel={({route, focused} : {route: Route; focused: boolean}) => (
            <Text className={focused ? "text-white font-poppins-semibold" : "primary-100"}>
              {route.title}
            </Text>
          )}
        />
      )} 
    />

  );
}
