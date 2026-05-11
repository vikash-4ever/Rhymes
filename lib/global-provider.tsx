import { Playlist } from "@/types/playlist";
import { Song } from "@/types/song";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { getArtistImage } from "./api/musicApis";
import { account, config, databases, getLikedSongs, getUserPlaylists, Query, toggleArtistLike, toggleLike } from "./appwrite";

type UserProfile = {
  $id: string;
  userId: string;
  email: string;
  likedAudios: string[];
  likedArtists: string[];
  isGuest?: boolean;
} | null;

type GlobalContextType = {
  user: UserProfile;
  loading: boolean;
  likesLoading: boolean;
  isGuestMode: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => Promise<void>;

  recentlyPlayed: Song[];
  likedSongs: string[];
  likedArtists: string[];
  artistImages: Record<string, string>;
  setRecentlyPlayed: React.Dispatch<React.SetStateAction<Song[]>>;
  setLikedSongs: React.Dispatch<React.SetStateAction<string[]>>;
  setArtistImages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleToggleLike: (songId: string) => Promise<void>;
  handleToggleArtist: (artistName: string) => Promise<void>;

  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  loadPlaylists: () => Promise<void>;
  loadArtistImage: (artist: string) => Promise<string | null>;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [likesLoading, setLikesLoading] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [likedArtists, setLikedArtists] = useState<string[]>([]);
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isGuestMode, setIsGuestMode] = useState(false);
  
  const optimizeImage = (url: string) => {
    return url.replace(/\d+x\d+/, "256x256");
  };

  const loadArtistImage = async (artist: string) => {
    if (artistImages[artist]) {return artistImages[artist]};

    try {

      const image = await getArtistImage(artist);

      if (image) {
        const optimized = optimizeImage(image);

        setArtistImages((prev) => ({
          ...prev,
          [artist]: optimized,
        }));
        return optimized;
      }
      
      return null;
    } catch (error) {
      console.log("Artist image load error:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadUser = async () => {

      try {

        const isGuest = await AsyncStorage.getItem("guestMode");
        if (isGuest === "true") {

          setIsGuestMode(true);

          setUser({
            $id: "guest",
            userId: "guest",
            email: "Guest",
            likedAudios: [],
            likedArtists: [],
            isGuest: true,
          });
          setLoading(false);
          return;
        }

        const session = await account.get().catch(() => null);

        if (!session) {
          setUser(null);
          setLoading(false);
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
        const doc = currentUser as any;
        setUser({
          $id: doc.$id,
          userId: doc.userId,
          email: doc.email,
          likedAudios: doc.likedAudios || [],
          likedArtists: doc.likedArtists || [],
        });
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
      try {
        await account.deleteSession("current");
      } catch (e) {
        console.log("Current session delete failed");
      }

      await account.deleteSessions().catch(() => {});

      setUser(null);
      setIsGuestMode(false);

      await AsyncStorage.multiRemove(["recentlyPlayed", "guestMode"]);
      router.dismissAll();
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
        if(!user?.$id || user.isGuest ) {
          setLikedSongs([]);
          return;
        }
        const data = await getLikedSongs(user.$id);
        setLikedSongs(data || []);
        setLikedArtists(user.likedArtists || []);
      } catch(error) {
        console.log("Likes Error.", error);
        setLikedSongs([]);
      } finally {
        setLikesLoading(false);
      }
    };
    loadLikes();
  }, [user]);

  const loginAsGuest = async () => {
    const guestUser = {
      $id: "guest",
      userId: "guest",
      email: "Guest",
      likedAudios: [],
      likedArtists: [],
      isGuest: true,
    };

    setUser(guestUser);
    setIsGuestMode(true);
    
    await AsyncStorage.setItem("guestMode", "true");

    router.replace("/(root)/(tabs)");
  };

  const handleToggleLike = async (songId: string) => {
    if(!user?.$id || user.isGuest) return;
    const updated = await toggleLike(user.$id, songId);
    setLikedSongs(updated);
  };

  const handleToggleArtist = async (
    artistName: string
  ) => {

    if (!user?.$id || user.isGuest) return;

    const updated = await toggleArtistLike(
      user.$id,
      artistName
    );

    setLikedArtists(updated);
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

      const doc = currentUser as any;

      setUser({
      $id: doc.$id,
      userId: doc.userId,
      email: doc.email,
      likedAudios: doc.likedAudios || [],
      likedArtists: doc.likedArtists || [],
    });
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
        $createdAt: doc.$createdAt,
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
        likedArtists,
        setArtistImages,
        artistImages,
        handleToggleLike,
        handleToggleArtist,
        loadArtistImage,
        playlists,
        setPlaylists,
        loadPlaylists,
        loginAsGuest,
        isGuestMode,  
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