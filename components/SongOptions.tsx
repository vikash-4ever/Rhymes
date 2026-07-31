import { getArtistImage } from "@/lib/api/musicApis";
import {
  addEditorsPick,
  deleteEditorsPick,
  getEditorsPick,
  toggleSongInPlaylist
} from "@/lib/appwrite";

import { ADMIN_ID } from "@/lib/config";
import { useGlobalContext } from "@/lib/global-provider";
import { usePlayer } from "@/lib/PlayerContext";
import { Song } from "@/types/song";

import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Share, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

type Props = {
  song: Song | null;
  onClose: () => void;

  showPlayNext?: boolean;
  showShare?: boolean;
  showGoToArtist?: boolean;
};

type SongAction = "playlist" | "editorsPick" | null;

export default function SongOptions({
  song,
  onClose,
}: Props) {

  const {
    user,
    likedSongs,
    playlists,
    loadPlaylists,
    handleToggleLike,
  } = useGlobalContext();


  const {currentTrack, addToNextQueue, navigationContext} = usePlayer();

  const isAdmin = user?.$id === ADMIN_ID;

  const isLiked = song ? likedSongs.includes(song.id) : false;

  const canPlayNext = currentTrack && song?.id !== currentTrack.id;

  const [editorsPickDocId, setEditorsPickDocId] =
    useState<string | null>(null);

  const [songAction, setSongAction] = useState<SongAction>(null);
  const [updatingPlaylistId, setUpdatingPlaylistId] = useState<string | null>(null);
  const busy = songAction !== null;

  useEffect(() => {
    const checkEditorsPick = async () => {
      if (!song?.id || !isAdmin) return;

      const docs = await getEditorsPick();

      const existing = docs.find(
        (doc: any) => doc.songId === song.id
      );

      if (existing) {
        setEditorsPickDocId(existing.$id);
      }
    };

    checkEditorsPick();
  }, [song?.id, isAdmin]);

  if (!song) return null;

  return (
    <View className="bg-[#000000cf] rounded-2xl h-auto px-6 py-6">

      <Text 
        className="text-text2 text-xl self-center font-poppins-semibold mb-4" 
        numberOfLines={1} 
        ellipsizeMode="tail"
        >
        {song.title}
      </Text>

      {/* LIKE */}
      <TouchableOpacity
        className="py-2"
        onPress={async () => {
          if (!user) return;
          await handleToggleLike(song.id);
          onClose();
        }}
      >
        <Text className="text-white text-lg font-poppins-semibold">
          {isLiked
            ? "Remove from Favourite"
            : "Add to Favourite"}
        </Text>
      </TouchableOpacity>

      {/* PLAYLISTS */}
      {playlists.map((playlist) => {

        const isAdded =
          (playlist.songIds || []).includes(song.id);

        return (
          <TouchableOpacity
            key={playlist.$id}
            className="py-2"
            disabled={busy}
            onPress={async () => {

              setSongAction("playlist")
              setUpdatingPlaylistId(playlist.$id);

              try {
                await toggleSongInPlaylist(
                  playlist.$id,
                  song.id
                );
  
                await loadPlaylists();
  
                Toast.show({
                    type: "success",
                    text1: isAdded
                        ? `Removed from ${playlist.name}`
                        : `Added to ${playlist.name}`,
                });
  
                onClose();
              } catch(error) {
                Toast.show({
                    type: "error",
                    text1: "Couldn't update playlist",
                });
              } finally {
                    setSongAction(null);
                    setUpdatingPlaylistId(null);
              }
            }}
          >
            {(songAction === "playlist" && updatingPlaylistId === playlist.$id) ? (
              <View className="flex-row items-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white text-lg ml-3 font-poppins-semibold">
                      {isAdded ? "Removing from " : "Adding to "}
                      {playlist.name}
                  </Text>
              </View>
            ) : (
              <Text className="text-white text-lg font-poppins-semibold">
                {isAdded ? "Remove from " : "Add to "}
                {playlist.name}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}

      {/* EDITORS PICK */}
      {isAdmin && (
        <TouchableOpacity
          className="py-2"
          disabled={busy}
          onPress={async () => {
            setSongAction("editorsPick")

            try {
              if (editorsPickDocId) {
  
                await deleteEditorsPick(
                  editorsPickDocId
                );
  
                setEditorsPickDocId(null);
  
              } else {
  
                const doc =
                  await addEditorsPick(song.id);
  
                if (doc?.$id) {
                  setEditorsPickDocId(doc.$id);
                }
              }
              Toast.show({
                    type: "success",
                    text1: editorsPickDocId
                        ? "Removed from Editor's Pick"
                        : "Added to Editor's Pick",
                });
              onClose(); 
            } catch (error) {
              Toast.show({
                    type: "error",
                    text1: "Couldn't update Editor's Pick",
                });
            } finally {setSongAction(null)}

          }}
        >
          { songAction === "editorsPick" ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white text-lg ml-3 font-poppins-semibold">
                  {editorsPickDocId ? "Removing from Editor's Pick" : "Adding to Editor's Pick"}
              </Text>
          </View>
          ) : (
            <Text className="text-white text-lg font-poppins-semibold">
              {editorsPickDocId
                ? "Remove from Editor's Pick"
                : "Add to Editor's Pick"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* GO TO ARTIST */}
      <TouchableOpacity
        className="py-2"
        onPress={async () => {

          const firstArtist =
            song.artists?.[0];

          if (!firstArtist) return;
        
          let artistImage = await getArtistImage(firstArtist.name);

          if (!artistImage) {
            artistImage = "https://global.honda/en/RandD/assets/img/member/member_ninomiya.jpg"
          }
        
          router.push({
            pathname: navigationContext.route,
            params: {
              type: "artist",
              title: firstArtist.name,
              artist: firstArtist.name,
              image: artistImage || "",
              source: navigationContext.source,
            },
          });
          onClose();
        }}
      >
        <Text className="text-white text-lg font-poppins-semibold">
          Go to Artist
        </Text>
      </TouchableOpacity>

      {/* PLAY NEXT */}
      {canPlayNext && (
        <TouchableOpacity
          className="py-2"
          onPress={async() => {
            try {
              await addToNextQueue(song);
              Toast.show({
                      type: "success",
                      text1: "Added to Play Next",
                  });
              onClose();
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Couldn't add to Play Next"
              })
            }
          }}
        >

          <Text className="text-white text-lg font-poppins-semibold">
            Play Next
          </Text>
        </TouchableOpacity>
      )}

      {/* SHARE */}
      <TouchableOpacity
        className="py-2"
        onPress={async () => {

          await Share.share({
            message:
              `${song.title} - ${song.artists?.map(
                (a) => a.name
              ).join(", ")}`,
          });

          onClose();
        }}
      >
        <Text className="text-white text-lg font-poppins-semibold">
          Share
        </Text>
      </TouchableOpacity>

      {/* CANCEL */}
      <TouchableOpacity
        className="py-4 mt-2"
        onPress={onClose}
      >
        <Text className="text-center text-gray-500 text-lg font-poppins-semibold">
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}