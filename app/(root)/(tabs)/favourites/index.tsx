import icons from "@/constants/icons";
import images from "@/constants/images";
import { createPlaylist, deletePlaylist, renamePlaylist, updatePlaylistThumbnail } from "@/lib/appwrite";
import { useAuth, useGuest, useLikes, usePlaylists } from "@/lib/global-provider";
import { pickAndCompressImage, uploadToCloudinary } from "@/lib/image";
import { Playlist } from "@/types/playlist";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as React from "react";
import { ActivityIndicator, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { TabBar, TabView } from "react-native-tab-view";
import Toast from "react-native-toast-message";

type Route = { key: string; title: string };

type PlaylistAction =
  | "create"
  | "delete"
  | "rename"
  | "thumbnail"
  | null;

const PlaylistsRoute = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { requireSignIn } = useGuest();
  const { likedSongs, likesLoading } = useLikes();
  const { loadPlaylists, playlists } = usePlaylists();
  const [showModal, setShowModal] = React.useState(false);
  const [playListName, setPlayListName] = React.useState("");
  const [optionsModal, setOptionsModal] = React.useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = React.useState<Playlist | null>(null);
  const [renameModal, setRenameModal] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [playlistImage, setPlaylistImage] = React.useState<string | null>(null);
  const [playlistAction, setPlaylistAction] = React.useState<PlaylistAction>(null);

  const busy = playlistAction !== null;

  const handlePickPlaylistImage = React.useCallback( async () => {
    const uri = await pickAndCompressImage();
    if (!uri) return;
    setPlaylistImage(uri);
  }, []); 

  const handleCreatePlaylist = React.useCallback(
    async () => {
      if (!playListName.trim()) return;
      if (requireSignIn()) return;
      setPlaylistAction("create");
      try {
        let imageUrl: string | undefined;
  
        if (playlistImage) {
          imageUrl = await uploadToCloudinary(playlistImage);
        }
  
        await createPlaylist(
          user!.$id,
          playListName.trim(),
          imageUrl
        );
  
        setPlayListName("");
        setPlaylistImage(null);
        setShowModal(false);
  
        await loadPlaylists();
        Toast.show({
          type: "success",
          text1: "Playlist created",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Couldn't create playlist",
        });
        console.log("Create Playlist Error:", error);
      } finally {
        setPlaylistAction(null);
      }
    }, [playListName, playlistImage, user, requireSignIn, loadPlaylists]); 

  const handleDeletePlaylist = React.useCallback(
    async (playlistId: string) => {
          
      if (requireSignIn()) return;
      setPlaylistAction("delete");
      try {
        await deletePlaylist(playlistId);
        await loadPlaylists();
        Toast.show({
          type: "success",
          text1: "Playlist deleted",
        });
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Couldn't delete playlist",
        });
        console.log("Delete Playlist Error:", error);
      } finally {
        setPlaylistAction(null);
      }
    }, [requireSignIn, loadPlaylists]);

  const handleThumbnailUpdate = React.useCallback(
    async () => {
  
      if (requireSignIn()) return;
  
      if (!selectedPlaylist?.$id) return;
  
      setPlaylistAction("thumbnail");
      try {
        const compressedUri = await pickAndCompressImage();
        if (!compressedUri) return;
    
        const imageUrl = await uploadToCloudinary(compressedUri);
    
        await updatePlaylistThumbnail(selectedPlaylist.$id, imageUrl);
        await loadPlaylists();
        Toast.show({
          type: "success",
          text1: "Cover updated",
        });
    
        setOptionsModal(false);
        setSelectedPlaylist(null);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Couldn't update cover",
        });
        console.error(error);
      } finally {
        setPlaylistAction(null);
      }
    }, [requireSignIn, selectedPlaylist, loadPlaylists]);

  const handleRenamePlaylist = React.useCallback(
    async () => {

                if (requireSignIn()) return;

                if (!selectedPlaylist?.$id || !newName.trim()) return;
                
                setPlaylistAction("rename");
                try {
                  await renamePlaylist(
                    selectedPlaylist.$id,
                    newName.trim()
                  );
                  await loadPlaylists();
  
                  setRenameModal(false);
                  setOptionsModal(false);
                  setSelectedPlaylist(null);
                  setNewName("");
                  Toast.show({
                    type: "success",
                    text1: "Playlist renamed",
                  });
                }catch(error) {
                  Toast.show({
                    type: "error",
                    text1: "Couldn't rename playlist",
                  });
                  console.error(error);
                } finally {
                  setPlaylistAction(null);
                }
              }, [requireSignIn, selectedPlaylist, newName, loadPlaylists]);

    const handleConfirmDelete = React.useCallback(
      async () => {
              if (!selectedPlaylist?.$id) return;
              await handleDeletePlaylist(selectedPlaylist.$id);
              setOptionsModal(false);
              setSelectedPlaylist(null);
              setNewName("");
            }, [selectedPlaylist, handleDeletePlaylist]
    )

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

        <TouchableOpacity 
          onPress={() => {
            if (requireSignIn()) return;
            setShowModal(true);
          }} 
          className="flex flex-row mt-2 items-center"
        >
          <View className="bg-[#ffffff30] h-14 w-14 items-center justify-center">
            <Image source={icons.add} tintColor={"white"} className="size-5" />
          </View>
          <Text className="text-text1 font-poppins-medium text-lg ml-4">Create Playlist</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push({
            pathname: "/(root)/(tabs)/favourites/listScreen",
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
            pathname: "/(root)/(tabs)/favourites/listScreen",
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
                  pathname: "/(root)/(tabs)/favourites/listScreen",
                  params: {
                    type: "playlist",
                    id: playlist.$id,
                    title: playlist.name,
                    coverImage: playlist.coverImage || "",
                  }
                })}
                onLongPress={() => {
                  if (requireSignIn()) return;
                  setSelectedPlaylist(playlist);
                  setOptionsModal(true);
                }}
                delayLongPress={100}
                className="flex flex-row mt-2 items-center"
              >
                <View className="bg-gray-700 h-14 w-14 items-center justify-center">
                  <Image source={playlist.coverImage ? {uri: playlist.coverImage} : icons.music}
                    className={playlist.coverImage ? "size-14" : "size-6"}
                    tintColor={playlist.coverImage ? undefined : "white"}
                  />
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
      <TouchableOpacity 
        activeOpacity={1}
        onPress={() => {
          setShowModal(false);
          setPlayListName("");
          setPlaylistImage(null);
        }}
        className="flex h-full bg-[#00000080] justify-center items-center">
        
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {}}
          className="flex w-[80%] bg-white items-center rounded-lg py-4 px-4">
          
          <Text className="text-black text-2xl font-poppins-semibold my-4">
            Create Playlist
          </Text>

          <TouchableOpacity
              onPress={handlePickPlaylistImage}
              disabled={busy}
              className="self-center mb-5"
          >
              {playlistImage ? (
                <View>
                  <Image
                      source={{ uri: playlistImage }}
                      className="h-28 w-28 rounded-lg"
                  />
                  <TouchableOpacity
                      onPress={() => setPlaylistImage(null)}
                      className="absolute -top-2 -right-2 bg-black rounded-full h-7 w-7 items-center justify-center"
                  >
                      <Text className="text-white text-xl font-poppins-regular text-lg">×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                  <View className="h-28 w-28 rounded-lg bg-[#00000008] items-center justify-center">
                      <Image
                          source={icons.imageUpload}
                          className="size-10"
                          tintColor="#9ca3af"
                      />
                      <Text className="mt-2 text-xs font-poppins-semibold text-[#9ca3af]">
                          Choose Cover
                      </Text>
                  </View>
              )}
          </TouchableOpacity>

          <TextInput
            placeholder="Enter playlist name"
            placeholderTextColor="#9ca3af"
            value={playListName}
            editable={!busy}
            onChangeText={setPlayListName}
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-lg font-poppins-medium text-black mt-2"
          />

          <View className="flex-col items-center gap-4 mt-6 mb-2 w-full">

            <TouchableOpacity
              onPress={handleCreatePlaylist}
              disabled={!playListName.trim() || busy}
              className={`w-full rounded-full items-center justify-center ${
                playListName.trim() ? "bg-primary-300" : "bg-gray-600"
              }`}
            >
              {playlistAction === "create" ? (
                 <View className="flex-row items-center py-3">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-lg ml-3 font-poppins-semibold">
                    Creating...
                  </Text>
                </View>
              ): (
                <Text className="text-white text-lg px-8 py-3 font-poppins-semibold">
                  Create
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowModal(false);
                setPlayListName("");
                setPlaylistImage(null);
              }}
              disabled={busy}
              className="p-2"
            >
              <Text className="text-black text-lg font-poppins-semibold">
                Cancel
              </Text>
            </TouchableOpacity>

          </View>

        </TouchableOpacity>

      </TouchableOpacity>
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
            onPress={handleConfirmDelete}
            disabled={busy}
            className="py-3"
          >
            {playlistAction === "delete" ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#ef4444" size="small" />
                <Text className="text-red-500 text-lg ml-3 font-poppins-medium">
                  Deleting...
                </Text>
              </View>
            ) : (
              <Text className="text-red-500 text-lg font-poppins-medium">
                Delete
              </Text>
            )}
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
            disabled={busy}
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
            onPress={handleThumbnailUpdate}
            className="py-3"
            disabled={busy}
          >
            {playlistAction === "thumbnail" ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-lg ml-3 font-poppins-medium">
                  Updating...
                </Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-poppins-medium">Edit Thumbnail</Text>
            )}
          </TouchableOpacity>

          {/* CANCEL */}
          <TouchableOpacity
            onPress={() => {
              setOptionsModal(false);
              setSelectedPlaylist(null);
              setNewName("");

            }}
            disabled={busy}
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
            className="w-full border border-gray-300 rounded-md px-4 py-3 text-black text-lg font-poppins-medium mt-2"
          />

          <View className="flex-col items-center gap-4 mt-6 mb-2 w-full">

            <TouchableOpacity
              onPress={handleRenamePlaylist}
              disabled={!newName.trim() || busy}
              className={`w-full rounded-full items-center justify-center ${
                newName.trim() ? "bg-primary-300" : "bg-gray-600"
              }`}
            >
              {playlistAction === "rename" ? (
                <View className="flex-row items-center py-3">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-lg ml-3 font-poppins-semibold">
                    Saving...
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-lg px-8 py-3 font-poppins-semibold">
                  Save
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setRenameModal(false);
                setSelectedPlaylist(null);
                setNewName("");
              }}
              disabled={busy}
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

const ArtistsRoute = () => {

  const router = useRouter();

  const {likedArtists, artistImages, loadArtistImage } = useLikes();
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({});

  const handleArtistImageError = React.useCallback((artist: string) => {
    setFailedImages(prev => ({
        ...prev,
        [artist]: true,
    }));
  }, []);

  React.useEffect(() => {
    const load = async () => {
      await Promise.all(likedArtists.map(loadArtistImage));
    };
    load();
  }, [likedArtists, loadArtistImage])

  if (likedArtists.length === 0) {
    return (
      <View className="flex-1 bg-primary-200 items-center justify-center">
        <Text className="text-primary-100 font-poppins-medium">
          No artists added yet.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary-200 p-4">

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        {likedArtists.map((artist) => (
          <TouchableOpacity
            key={artist}
            onPress={() =>
              router.push({
                pathname: "/(root)/(tabs)/favourites/listScreen",
                params: {
                  type: "artist",
                  title: artist,
                  artist: artist,
                  image: artistImages[artist] || "",
                  source: "favourites"
                },
              })
            }
            className="flex-row items-center mt-1 py-1"
          >
            <View className="h-16 w-16 rounded-full bg-[#ffffff20] items-center justify-center border-2 border-text2 p-[2px]">
              <Image
                  source={
                      failedImages[artist]
                          ? images.artist
                          : artistImages[artist]
                              ? {
                                  uri: artistImages[artist],
                                  cache: "force-cache",
                              }
                              : images.artist
                  }
                  onError={() => handleArtistImageError(artist)}
                  className="h-full w-full rounded-full"
              />
            </View>

            <View className="ml-4">
              <Text className="text-white text-lg font-poppins-medium">
                {artist}
              </Text>

              <Text className="text-text2">
                Artist
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

    </View>
  );
};

export default function Favourites() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  const routes = React.useMemo(() => ([
    { key: "playlists", title: "Playlists" },
    { key: "artists", title: "Artists" },
  ]), []);

  const renderScene = React.useCallback(
    ({route} : {route: Route}) =>  {
      switch(route.key) {
        case "playlists":
          return <PlaylistsRoute/>;
        case "artists":
          return <ArtistsRoute/>;
          default:
            return null;
    }
  }, []);

  const renderTabBar = React.useCallback(
    (props : any) => (
        <TabBar
          {...props}
          style={{backgroundColor:'#000000'}}
          indicatorStyle={{backgroundColor:'white'}}
          tabStyle={{width: layout.width / routes.length}}
          labelStyle={{
            fontFamily: "Poppins-Medium",
            fontSize: 15,
            textTransform: "none",
          }}
          contentContainerStyle={{flex:1, justifyContent:'space-between'}}
          renderLabel={({route, focused} : {route: Route; focused: boolean}) => (
            <Text style={{
              fontFamily: "Poppins-Medium",
              fontSize: 15,  
              color: focused ? "white" : "#6f7684"}}
            >
              {route.title} 
            </Text>
          )}
        />
      ), [layout.width, routes.length]);

  return (
    <TabView
      navigationState={{index, routes}}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{width: layout.width}}  
      renderTabBar={renderTabBar} 
    />
  );
}
