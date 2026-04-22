import { Account, Client, Databases, ID, Query } from "react-native-appwrite";

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_NAME!);

export const account = new Account(client);
export const databases = new Databases(client);
export { ID, Query };

export const config = {
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
  usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
  playlistsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PLAYLISTS_COLLECTION_ID!,
};

export const getCurrentUser = async () => {
  try{
    return await account.get();
  } catch (error) {
    console.log("Get User Error", error);
    return null;
  }
};

export const getLikedSongs = async (userDocId: string) => {
      const doc = await databases.getDocument(
        config.databaseId,
        config.usersCollectionId,
        userDocId,
      );
    return doc.likedAudios || [];
};

export const toggleLike = async (userDocId: string, songId: string) => {
    const doc = await databases.getDocument(
      config.databaseId,
      config.usersCollectionId,
      userDocId,
    );

    let liked = doc.likedAudios || [];

    if (liked.includes(songId)) {
      liked = liked.filter((id: string) => id !== songId);
    } else{
      liked.push(songId);
    }

    await databases.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userDocId,
      {likedAudios: liked}
    );
    return liked;
};

export const isSongLiked = (likedSongs: string[], songId: string) => {
  return likedSongs.includes(songId);
}

export const createPlaylist = async (userId: string, name: string) => {
  return await databases.createDocument(
    config.databaseId,
    config.playlistsCollectionId,
    ID.unique(),
    {
      name,
      userId,
      songIds: [],
    }
  );
};

export const deletePlaylist = async (playlistId: string) => {
  return await databases.deleteDocument(
    config.databaseId,
    config.playlistsCollectionId,
    playlistId
  )
}

export const getUserPlaylists = async (userId: string) => {
  const res = await databases.listDocuments(
    config.databaseId,
    config.playlistsCollectionId,
    [Query.equal("userId", userId)]
  );
  return res.documents;
};

export const toggleSongInPlaylist = async (
  playlistId: string,
  songId: string
) => {
  const doc = await databases.getDocument(
    config.databaseId,
    config.playlistsCollectionId,
    playlistId
  );

  let songs = doc.songIds || [];

  if (songs.includes(songId)) {
    songs = songs.filter((id: string) => id !== songId);
  } else {
    songs.push(songId);
  }

  await databases.updateDocument(
    config.databaseId,
    config.playlistsCollectionId,
    playlistId,
    { songIds: songs }
  );

  return songs;
};