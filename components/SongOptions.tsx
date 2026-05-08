import { getArtistImage } from "@/lib/api/musicApis";
import {
    addEditorsPick,
    deleteEditorsPick,
    getEditorsPick,
    toggleLike,
    toggleSongInPlaylist,
} from "@/lib/appwrite";

import { ADMIN_ID } from "@/lib/config";
import { useGlobalContext } from "@/lib/global-provider";
import { Song } from "@/types/song";

import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Share, Text, TouchableOpacity, View } from "react-native";

type Props = {
  song: Song | null;
  onClose: () => void;

  showPlayNext?: boolean;
  showShare?: boolean;
  showGoToArtist?: boolean;
};

export default function SongOptions({
  song,
  onClose,
}: Props) {

  const {
    user,
    likedSongs,
    setLikedSongs,
    playlists,
    loadPlaylists,
  } = useGlobalContext();

  //const { addToNextQueue } = usePlayer();

  const isAdmin = user?.$id === ADMIN_ID;

  const isLiked =
    song ? likedSongs.includes(song.id) : false;

  const [editorsPickDocId, setEditorsPickDocId] =
    useState<string | null>(null);

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
  }, [song?.id]);

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

          const updated = await toggleLike(
            user.$id,
            song.id
          );

          setLikedSongs(updated);

          onClose();
        }}
      >
        <Text className="text-white text-lg font-poppins-medium">
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
            onPress={async () => {

              await toggleSongInPlaylist(
                playlist.$id,
                song.id
              );

              await loadPlaylists();

              onClose();
            }}
          >
            <Text className="text-white text-lg font-poppins-medium">
              {isAdded ? "Remove from " : "Add to "}
              {playlist.name}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* EDITORS PICK */}
      {isAdmin && (
        <TouchableOpacity
          className="py-2"
          onPress={async () => {

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

            onClose();
          }}
        >
          <Text className="text-white text-lg font-poppins-medium">
            {editorsPickDocId
              ? "Remove from Editor's Pick"
              : "Add to Editor's Pick"}
          </Text>
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
            pathname: "/favouriteSongs",
            params: {
              type: "artist",
              title: firstArtist.name,
              artist: firstArtist.name,
              image: artistImage || "",
            },
          });
          onClose();
        }}
      >
        <Text className="text-white text-lg font-poppins-medium">
          Go to Artist
        </Text>
      </TouchableOpacity>

      {/* PLAY NEXT */}
      <TouchableOpacity
        className="py-2"
        onPress={() => {

        //   addToNextQueue(song);

          onClose();
        }}
      >
        <Text className="text-white text-lg font-poppins-medium">
          Play Next
        </Text>
      </TouchableOpacity>

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
        <Text className="text-white text-lg font-poppins-medium">
          Share
        </Text>
      </TouchableOpacity>

      {/* CANCEL */}
      <TouchableOpacity
        className="py-4 mt-2"
        onPress={onClose}
      >
        <Text className="text-center text-gray-500 text-lg font-poppins-medium">
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
}