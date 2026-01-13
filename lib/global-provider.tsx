// lib/global-provider.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Models } from "react-native-appwrite";
import { account, config, databases, Query } from "./appwrite";

type UserProfile = Models.Document | null;

export type Track = {
  title: string;
  artist?: string;
  url: string; // original link (search result link)
  sourceUrl?: string; // actual streamable URL (optional)
  thumbnail?: string | number;
};

type GlobalContextType = {
  user: UserProfile;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  logout: () => Promise<void>;

  recentlyPlayed: Track[];
  setRecentlyPlayed: React.Dispatch<React.SetStateAction<Track[]>>;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);

  // fetch current user session/profile
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const session = await account.get();
        if (session) {
          const res = await databases.listDocuments(
            config.databaseId,
            config.usersCollectionId,
            [Query.equal("email", session.email)]
          );
          setUser(res.documents[0] || null);
        }
      } catch (error) {
        console.log("⚠️ No active session:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    getCurrentUser();
  }, []);

  // load recently played from storage once
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

  // persist recentlyPlayed whenever it changes
  useEffect(() => {
    AsyncStorage.setItem("recentlyPlayed", JSON.stringify(recentlyPlayed));
  }, [recentlyPlayed]);

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      router.push("/");
    } catch (error) {
      console.log("Logout error:", error);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
        recentlyPlayed,
        setRecentlyPlayed,
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
