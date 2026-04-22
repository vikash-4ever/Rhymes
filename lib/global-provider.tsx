import { Playlist } from "@/types/playlist";
import { Song } from "@/types/song";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { account, config, databases, getLikedSongs, getUserPlaylists, Query, toggleLike } from "./appwrite";

type UserProfile = Models.Document | null;

type GlobalContextType = {
  user: UserProfile;
  loading: boolean;
  likesLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;

  recentlyPlayed: Song[];
  likedSongs: string[];
  setRecentlyPlayed: React.Dispatch<React.SetStateAction<Song[]>>;
  setLikedSongs: React.Dispatch<React.SetStateAction<string[]>>;
  handleToggleLike: (songId: string) => Promise<void>;

  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  loadPlaylists: () => Promise<void>;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [likesLoading, setLikesLoading] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const session = await account.get().catch(() => null);

        if (!session) {
          setUser(null);
          return;
        }

        const res = await databases.listDocuments(
          config.databaseId,
          config.usersCollectionId,
          [Query.equal("userId", session.$id)]
        );

        let currentUser : Models.Document;

        if (res.documents.length === 0 ) {
          currentUser = await databases.createDocument(
            config.databaseId,
            config.usersCollectionId,
            ID.unique(),
            {
              email: session.email,
              userId: session.$id,
              likedAudios: [],
            } as any
          )
        } else {
          currentUser = res.documents[0];
        }
        setUser(currentUser);
      } catch(error) {
        console.log("User fetch error : ", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // load recently played
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("recentlyPlayed");
        if (saved) setRecentlyPlayed(JSON.parse(saved));
      } catch (e) {
        console.warn("Failed to load recently played:", e);
      }
    })();
  }, []);

  // save recently played
  useEffect(() => {
    AsyncStorage.setItem("recentlyPlayed", JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  const logout = async () => {
    try {
      const session = await account.get().catch(() => null);
      if(session) {
        await account.deleteSession("current");
      }
      setUser(null);

      await AsyncStorage.multiRemove(["recentlyPlayed"]);
      router.replace("/login/signIn");
      console.log("Clean Logout Done!");
    } catch (error) {
      console.log("Logout Error : ", error);
    }
  };

  useEffect(() => {
    const loadLikes = async () => {
      if (!user) {
        setLikedSongs([]);
        setLikesLoading(false);
        return;
      }
      setLikesLoading(true);
      try{
        const data = await getLikedSongs(user.$id);
        setLikedSongs(data || []);
      } catch(error) {
        console.log("Likes Error.", error);
        setLikedSongs([]);
      } finally {
        setLikesLoading(false);
      }
    };
    loadLikes();
  }, [user]);

  const handleToggleLike = async (songId: string) => {
    if(!user) return;
    const updated = await toggleLike(user.$id, songId);
    setLikedSongs(updated);
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const session = await account.get().catch(() => null);

      if (!session) {
        setUser(null);
        return;
      }

      const res = await databases.listDocuments(
        config.databaseId,
        config.usersCollectionId,
        [Query.equal("userId", session.$id)]
      );

      let currentUser;

      if (res.documents.length === 0) {
        currentUser = await databases.createDocument(
          config.databaseId,
          config.usersCollectionId,
          ID.unique(),
          {
            email: session.email,
            userId: session.$id,
            likedAudios: [],
          } as any
        );
      } else {
        currentUser = res.documents[0];
      }

      setUser(currentUser);
    } finally {
      setLoading(false);
    }
  };

  console.log("USER DOC ID:", user?.$id);
  console.log("LIKED SONG IDS:", likedSongs);

  const loadPlaylists = async() => {
    if (!user) return;

    try {
      const data = await getUserPlaylists(user.$id);

      const formatted: Playlist[] = data.map((doc: any) => ({
        $id: doc.$id,
        name: doc.name,
        userId: doc.userId,
        songIds: doc.songIds || [],
        coverImage: doc.coverImage,
        $createdAt: doc.$createdSAt,
        $updatedAt: doc.$updatedAt,
      }));
      setPlaylists(formatted);
    } catch(error) {
      console.log("Playlist load error : ", error);
    }
  }

  useEffect(() => {
    if (user) {
      loadPlaylists();
    } else {
      setPlaylists([]);
    }
  },[user])

  return (
    <GlobalContext.Provider
      value={{
        user,
        setUser,
        refreshUser,
        loading,
        likesLoading,
        logout,
        recentlyPlayed,
        setRecentlyPlayed,
        likedSongs,
        setLikedSongs,
        handleToggleLike,
        playlists,
        setPlaylists,
        loadPlaylists,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("useGlobalContext must be used within GlobalProvider");
  return context;
};