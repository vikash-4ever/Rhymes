// PlayerContext.tsx — FINAL WORKING VERSION
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { createContext, useContext, useEffect, useState } from "react";
import { config, databases } from "./appwrite";
import { useGlobalContext } from "./global-provider";
import { resolveAudio } from "./songsApi";

const DATABASE_ID = config.databaseId;
const USER_COLLECTION_ID = config.usersCollectionId;

export type Track = {
  title: string;
  artist?: string;
  url: string;
  thumbnail?: string;
  originalLink?: string;
};

export type PlayerContextType = {
  currentTrack: Track | null;
  isPlaying: boolean;
  isPreparing: boolean;
  audioSource: string | null;

  player: any;
  playTrack: (track: Track) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  stopTrack: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;

  toggleLikeTrack: (track: Track) => Promise<void>;
  isTrackLiked: (track: Track) => boolean;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [audioSource, setAudioSource] = useState<string | null>(null);

  // Player re-creates whenever audioSource changes
  const player = useAudioPlayer(audioSource ?? undefined);
  const status = useAudioPlayerStatus(player);

  const isPlaying = Boolean(status?.playing);
  const [isPreparing, setIsPreparing] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const { user, setUser, recentlyPlayed, setRecentlyPlayed } =
    useGlobalContext() as any;

  // ----------------------------
  // Recently Played
  // ----------------------------
  const addToRecentlyPlayed = (track: Track) => {
    try {
      const newTrack = {
        title: track.title,
        artist: track.artist,
        url: track.originalLink ?? track.url,
        thumbnail: track.thumbnail,
      };
      const updated = [
        newTrack,
        ...recentlyPlayed.filter((t: any) => t.url !== newTrack.url),
      ].slice(0, 10);
      setRecentlyPlayed(updated);
    } catch (_) {}
  };

  // ----------------------------
  // Likes
  // ----------------------------
  const getLikedTracks = (): Track[] => {
    if (!user?.likedAudios) return [];
    return user.likedAudios.map((t: any) =>
      typeof t === "string" ? JSON.parse(t) : t
    );
  };

  const isTrackLiked = (track: Track): boolean => {
    return getLikedTracks().some((t) => t.url === track.url);
  };

  const toggleLikeTrack = async (track: Track) => {
    if (!user) return;

    const liked = isTrackLiked(track);
    const likedTracks = getLikedTracks();

    const updated = liked
      ? likedTracks.filter((t: any) => t.url !== track.url)
      : [...likedTracks, track];

    try {
      await databases.updateDocument(
        DATABASE_ID,
        USER_COLLECTION_ID,
        user.$id,
        { likedAudios: updated.map((t: any) => JSON.stringify(t)) }
      );
      setUser({ ...user, likedAudios: updated });
    } catch (_) {}
  };

  // ----------------------------
  // PLAY TRACK (Option A improved)
  // ----------------------------
  const playTrack = async (track: Track) => {
    try {
      setIsPreparing(true);
      setCurrentTrack(track);
      addToRecentlyPlayed(track);

      const ytLink = track.originalLink ?? track.url;
      const resolved = await resolveAudio(ytLink);

      if (!resolved?.audio_url) {
        setIsPreparing(false);
        return;
      }

      const streamUrl = resolved.audio_url;

      // Changing audioSource will recreate player internally
      setAudioSource(streamUrl);

    } catch (err) {
      console.warn("playTrack error:", err);
      setIsPreparing(false);
    }
  };

  // Auto-play whenever source changes and player gets recreated
  useEffect(() => {
    if (!audioSource) return;

    // Start playing as soon as new player is ready
    const startPlay = async () => {
      try {
        await player.play();
      } catch (_) {}
      setIsPreparing(false);
    };

    startPlay();
  }, [audioSource]);

  // ----------------------------
  // CONTROLS
  // ----------------------------
  const togglePlayPause = async () => {
    if (isPlaying) await player.pause();
    else await player.play();
  };

  const stopTrack = async () => {
    try {
      await player.pause();
      await player.seekTo(0);
    } catch (_) {}
  };

  const seekTo = async (seconds: number) => {
    try {
      await player.seekTo(seconds);
    } catch (err) {}
  };

  // ----------------------------
  // Auto-stop
  // ----------------------------
  useEffect(() => {
    if (status?.didJustFinish) {
      (async () => {
        try {
          await player.seekTo(0);
          await player.pause();
        } catch (_) {}
      })();
    }
  }, [status?.didJustFinish]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isPreparing,
        audioSource,

        player,
        playTrack,
        togglePlayPause,
        stopTrack,
        seekTo,

        toggleLikeTrack,
        isTrackLiked,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
};
