import { Account, Client, Databases, ID, Query } from "react-native-appwrite";


export const config = {
  platform: 'com.vikash_4ever.Rhymes',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
  usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!,
  playlistsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PLAYLISTS_COLLECTION_ID!,
  editorsPickCollectionId: process.env.EXPO_PUBLIC_APPWRITE_EDITORS_PICK_COLLECTION_ID!,
  searchHistoryCollectionId: process.env.EXPO_PUBLIC_APPWRITE_SEARCH_HISTORY_COLLECTION_ID!,
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
};
 
const client = new Client();
client
  .setEndpoint(config.endpoint)
  .setProject(config.projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export { ID, Query };

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
      liked = [songId, ...liked];
    }

    await databases.updateDocument(
      config.databaseId,
      config.usersCollectionId,
      userDocId,
      {likedAudios: liked}
    );
    return liked;
};

export const toggleArtistLike = async (
  userDocId: string,
  artistName: string
) => {

  const doc = await databases.getDocument(
    config.databaseId,
    config.usersCollectionId,
    userDocId
  );

  let likedArtists = doc.likedArtists || [];

  if (likedArtists.includes(artistName)) {
    likedArtists = likedArtists.filter(
      (name: string) => name !== artistName
    );
  } else {
    likedArtists = [artistName, ...likedArtists];
  }

  await databases.updateDocument(
    config.databaseId,
    config.usersCollectionId,
    userDocId,
    { likedArtists }
  );

  return likedArtists;
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

export const renamePlaylist = async (playlistId: string, newName: string) => {
  try {
    await databases.updateDocument(
      config.databaseId,
      config.playlistsCollectionId,
      playlistId,
      { name: newName }
    );
  } catch (err) {
    console.log("Rename error:", err);
  }
};

export const updatePlaylistThumbnail = async (
  playlistId: string,
  imageUrl: string
) => {
  await databases.updateDocument(
    config.databaseId,
    config.playlistsCollectionId,
    playlistId,
    { coverImage: imageUrl }
  );
};

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
    songs = [songId, ...songs];
  }

  await databases.updateDocument(
    config.databaseId,
    config.playlistsCollectionId,
    playlistId,
    { songIds: songs }
  );

  return songs;
};

export const addEditorsPick = async (songId: string) => {
  try {
    return await databases.createDocument(
      config.databaseId,
      config.editorsPickCollectionId,
      ID.unique(),
      {
        songId,
      }
    );
  } catch (error) {
    console.log("Add Editors Pick Error:", error);
  }
};

export const getEditorsPick = async () => {
  try {
    const res = await databases.listDocuments(
      config.databaseId,
      config.editorsPickCollectionId,
      [Query.orderDesc("$createdAt")]
    );

    return res.documents;
  } catch (error) {
    console.log("Get Editors Pick Error:", error);
    return [];
  }
};

export const deleteEditorsPick = async (docId: string) => {
  try {
    await databases.deleteDocument(
      config.databaseId,
      config.editorsPickCollectionId,
      docId
    );
  } catch (error) {
    console.log("Delete Editors Pick Error:", error);
  }
};

const savingSearches = new Set<string>();

export const saveSearchHistory = async (
  userId: string,
  songId: string
) => {

  const uniqueKey = `${userId}_${songId}`;

  // prevent duplicate simultaneous calls
  if (savingSearches.has(uniqueKey)) {
    return;
  }

  savingSearches.add(uniqueKey);

  try {

    // remove old history
    const existing = await databases.listDocuments(
      config.databaseId,
      config.searchHistoryCollectionId,
      [
        Query.equal("userId", userId),
        Query.equal("songId", songId),
      ]
    );

    if (existing.documents.length > 0) {

      await Promise.all(
        existing.documents.map((doc) =>
          databases.deleteDocument(
            config.databaseId,
            config.searchHistoryCollectionId,
            doc.$id
          )
        )
      );
    }

    // create fresh latest history
    await databases.createDocument(
      config.databaseId,
      config.searchHistoryCollectionId,
      ID.unique(),
      {
        userId,
        songId,
      }
    );

  } catch (error) {

    console.log(
      "saveSearchHistory error",
      error
    );

  } finally {

    savingSearches.delete(uniqueKey);

  }
};

export const getSearchHistory = async (
  userId: string
) => {
  try {

    const res = await databases.listDocuments(
      config.databaseId,
      config.searchHistoryCollectionId,
      [
        Query.equal("userId", userId),
        Query.orderDesc("$createdAt"),
        Query.limit(20),
      ]
    );

    return res.documents;

  } catch (error) {
    console.log("getSearchHistory error", error);
    return [];
  }
};

export const deleteSearchHistory = async (
  userId: string,
  songId?: string
) => {
  try {

    const queries: any[] = [
      Query.equal("userId", userId),
    ];

    // delete only one song history
    if (songId) {
      queries.push(
        Query.equal("songId", songId)
      );
    }

    const res = await databases.listDocuments(
      config.databaseId,
      config.searchHistoryCollectionId,
      queries
    );

    await Promise.all(
      res.documents.map((doc) =>
        databases.deleteDocument(
          config.databaseId,
          config.searchHistoryCollectionId,
          doc.$id
        )
      )
    );

  } catch (error) {
    console.log(
      "deleteSearchHistory error",
      error
    );
  }
};