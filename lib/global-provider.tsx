import GuestSignInModal from "@/components/GuestSignInModal";
import { Playlist } from "@/types/playlist";
import { Song } from "@/types/song";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { getArtistImage } from "./api/musicApis";
import { account, config, databases, getLikedSongs, getUserPlaylists, Query, toggleArtistLike, toggleLike } from "./appwrite";

type UserProfile = {
  $id: string;
  userId: string;
  email: string;
  name: string;
  likedAudios: string[];
  likedArtists: string[];
  isGuest?: boolean;
} | null;

type AuthContextType = {
  user: UserProfile;
  loading: boolean;
  isGuestMode: boolean;

  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;

  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
};

type LikesContextType = {
  likesLoading: boolean;

  likedSongs: string[];
  likedArtists: string[];

  artistImages: Record<string, string>;

  setLikedSongs: React.Dispatch<
    React.SetStateAction<string[]>
  >;

  setArtistImages: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;

  handleToggleLike: (
    songId: string
  ) => Promise<void>;

  handleToggleArtist: (
    artistName: string
  ) => Promise<void>;

  loadArtistImage: (
    artist: string
  ) => Promise<string | null>;
};

type PlaylistContextType = {
  playlists: Playlist[];

  setPlaylists: React.Dispatch<
    React.SetStateAction<Playlist[]>
  >;

  loadPlaylists: () => Promise<void>;
};

type RecentContextType = {
  recentlyPlayed: Song[];

  setRecentlyPlayed: React.Dispatch<
    React.SetStateAction<Song[]>
  >;
};

type GuestContextType = {
  showGuestModal: boolean;

  openGuestModal: () => void;

  closeGuestModal: () => void;

  requireSignIn: () => boolean;
};

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );

const LikesContext =
    createContext<LikesContextType | undefined>(
        undefined
    );

const PlaylistContext =
    createContext<PlaylistContextType | undefined>(
        undefined
    );

const RecentContext =
    createContext<RecentContextType | undefined>(
        undefined
    );

const GuestContext =
    createContext<GuestContextType | undefined>(
        undefined
    );
    
const optimizeImage = (url: string) => {
  return url.replace(/\d+x\d+/, "256x256");
};

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile>(null);
  const [loading, setLoading] = useState(true);
  const [likesLoading, setLikesLoading] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [likedArtists, setLikedArtists] = useState<string[]>([]);
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});
  const artistImagesRef = useRef<Record<string, string>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const openGuestModal = useCallback (() => {
    setShowGuestModal(true);
  }, []);

  const closeGuestModal = useCallback (() => {
    setShowGuestModal(false);
  }, []);

  const exitGuestMode = useCallback(
    async () => {
      await AsyncStorage.removeItem("guestMode");
  
      setUser(null);
      setIsGuestMode(false);
      setArtistImages({});
      artistImagesRef.current = {};
    }, []); 
  

  const requireSignIn = useCallback(() => {
    if (!user) {
      return true;
    }

    if (user.isGuest) {
      openGuestModal();
      return true;
    }

    return false;
  }, [user, openGuestModal]);

  const loadArtistImage = useCallback(
    async (artist: string) => {
      if (artistImagesRef.current[artist]) {return artistImagesRef.current[artist]};

      try {

        const image = await getArtistImage(artist);

        if (image) {
          const optimized = optimizeImage(image);

          artistImagesRef.current[artist] = optimized;

          setArtistImages(prev => ({
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
    }, []);
    

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
            name: "",
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
          name: doc.name,
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


  const logout = useCallback(
    async () => {
      try {
        try {
          await account.deleteSession("current");
        } catch (e) {
          console.log("Current session delete failed");
        }
  
        await account.deleteSessions().catch(() => {});
  
        setUser(null);
        setIsGuestMode(false);
        setArtistImages({});
        artistImagesRef.current = {};
  
        await AsyncStorage.multiRemove(["recentlyPlayed", "guestMode"]);
        router.dismissAll();
        router.replace("/login/signIn");
      } catch (error) {
        console.log("Logout Error : ", error);
      }
    }, []); 

  useEffect(() => {
    const loadLikes = async () => {
      if (!user) {
        setLikedSongs([]);
        setLikedArtists([]);
        setArtistImages({});
        artistImagesRef.current = {};
        setLikesLoading(false);
        return;
      }
      setLikesLoading(true);
      try{
        if(!user?.$id || user.isGuest ) {
          setLikedSongs([]);
          setLikedArtists([]);
          setArtistImages({});
          artistImagesRef.current = {};
          return;
        }
        const data = await getLikedSongs(user.$id);
        setLikedSongs(data || []);
        setLikedArtists(user.likedArtists || []);
      } catch(error) {
        console.log("Likes Error.", error);
        setLikedSongs([]);
        setLikedArtists([]);
      } finally {
        setLikesLoading(false);
      }
    };
    loadLikes();
  }, [user]);

  const loginAsGuest = useCallback(
    async () => {
      const guestUser = {
        $id: "guest",
        userId: "guest",
        email: "Guest",
        name: "",
        likedAudios: [],
        likedArtists: [],
        isGuest: true,
      };
  
      setUser(guestUser);
      setIsGuestMode(true);
      
      await AsyncStorage.setItem("guestMode", "true");
  
      router.replace("/(root)/(tabs)");
    }, []); 

  const handleToggleLike = useCallback (async (songId: string) => {
    if(!user?.$id || user.isGuest) return;
    const updated = await toggleLike(user.$id, songId);
    setLikedSongs(updated);
  }, [user]);

  const handleToggleArtist = useCallback (async (
    artistName: string
  ) => {

    if (!user?.$id || user.isGuest) return;

    const updated = await toggleArtistLike(
      user.$id,
      artistName
    );

    setLikedArtists(updated);
  }, [user]);

  const refreshUser = useCallback(
    async () => {
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
        name: doc.name,
        likedAudios: doc.likedAudios || [],
        likedArtists: doc.likedArtists || [],
      });
      } finally {
        setLoading(false);
      }
    }, []); 

  const loadPlaylists = useCallback(
    async() => {
      if (!user) {
        setPlaylists([]);
        return;
      }
  
      if (user.isGuest) {
        setPlaylists([]);
        return;
      }
  
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
    }, [user]); 

  useEffect(() => {
    if (user) {
      loadPlaylists();
    } else {
      setPlaylists([]);
    }
  },[user, loadPlaylists])

  const authValue = useMemo(
    () => ({
      user,
      loading,
      isGuestMode,
      setUser,
      refreshUser,
      logout,
      loginAsGuest,
      exitGuestMode,
    }),
    [
      user,
      loading,
      isGuestMode,
      refreshUser,
      logout,
      loginAsGuest,
      exitGuestMode,
    ]
  );

  const likesValue = useMemo(
    () => ({
      likesLoading,
      likedSongs,
      likedArtists,
      artistImages,
      setLikedSongs,
      setArtistImages,
      handleToggleLike,
      handleToggleArtist,
      loadArtistImage,
    }),
    [
      likesLoading,
      likedSongs,
      likedArtists,
      artistImages,
      handleToggleLike,
      handleToggleArtist,
      loadArtistImage,
    ]
  );

  const playlistValue = useMemo(
    () => ({
      playlists,
      setPlaylists,
      loadPlaylists,
    }),
    [playlists, loadPlaylists]
  );

  const recentValue = useMemo(
    () => ({
      recentlyPlayed,
      setRecentlyPlayed,
    }),
    [recentlyPlayed]
  );

  const guestValue = useMemo(
    () => ({
      showGuestModal,
      openGuestModal,
      closeGuestModal,
      requireSignIn,
    }),
    [
      showGuestModal,
      openGuestModal,
      closeGuestModal,
      requireSignIn,
    ]
  );

  return (
    <AuthContext.Provider value={authValue}>
      <LikesContext.Provider value={likesValue}>
        <PlaylistContext.Provider value={playlistValue}>
          <RecentContext.Provider value={recentValue}>
            <GuestContext.Provider value={guestValue}>
              {children}
              <GuestSignInModal />
            </GuestContext.Provider>
          </RecentContext.Provider>
        </PlaylistContext.Provider>
      </LikesContext.Provider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within GlobalProvider");
  }

  return context;
};

export const useLikes = () => {
  const context = useContext(LikesContext);

  if (!context) {
    throw new Error("useLikes must be used within GlobalProvider");
  }

  return context;
};

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);

  if (!context) {
    throw new Error("usePlaylists must be used within GlobalProvider");
  }

  return context;
};

export const useRecent = () => {
  const context = useContext(RecentContext);

  if (!context) {
    throw new Error("useRecent must be used within GlobalProvider");
  }

  return context;
};

export const useGuest = () => {
  const context = useContext(GuestContext);

  if (!context) {
    throw new Error("useGuest must be used within GlobalProvider");
  }

  return context;
};