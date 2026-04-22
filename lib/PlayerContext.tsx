import { Song } from "@/types/song";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useGlobalContext } from "./global-provider";

type PlayerContextType = {
  currentTrack: Song | null;
  isPlaying: boolean;
  isPreparing: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "one" | "all";
  player: any;

  playTrack: (track: Song) => Promise<void>;
  playQueue: (songs: Song[], startIndex: number) => Promise<void>;

  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;

  togglePlayPause: () => Promise<void>;
  stopTrack: () => Promise<void>;
  resetPlayer: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;

  setIsShuffle: React.Dispatch<React.SetStateAction<boolean>>;
  setRepeatMode: React.Dispatch<React.SetStateAction<"off" | "one" | "all">>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {

  const {user} = useGlobalContext();

  useEffect(() => {
    if (!user) {
      resetPlayer();
    }
  }, [user])
  useEffect(() => {
    setAudioModeAsync({
      interruptionMode: "duckOthers",
      playsInSilentMode: true,
    });
  }, []);

  const [audioSource, setAudioSource] = useState<string | null>(null);

  const player = useAudioPlayer(
    audioSource ? { uri: audioSource } : undefined
  );

  const status = useAudioPlayerStatus(player);

  const isPlaying = Boolean(status?.playing);

  const [isPreparing, setIsPreparing] = useState(false);

  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);

  const [queue, setQueue] = useState<Song[]>([]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const { recentlyPlayed, setRecentlyPlayed } = useGlobalContext();

  const [isShuffle, setIsShuffle] = useState(false);

  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");

  // -------------------------
  // Recently Played
  // -------------------------

  const addToRecentlyPlayed = (track: Song) => {
    const updated = [
      track,
      ...recentlyPlayed.filter((t) => t.id !== track.id),
    ].slice(0, 10);

    setRecentlyPlayed(updated);
  };

  // -------------------------
  // PLAY TRACK
  // -------------------------

  const playTrack = async (track: Song) => {
    try {

      setIsPreparing(true);
      setQueue([track]);
      setCurrentIndex(0);
      setCurrentTrack(track);
      addToRecentlyPlayed(track);
      setAudioSource(track.audio_url);
      setIsPreparing(false);
    } catch (err) {
      console.warn("playTrack error:", err);
      setIsPreparing(false);
    }
  };

  const playQueue = async (songs: Song[], startIndex: number) => {
    try{
      const track = songs[startIndex];
      setQueue(songs);
      setCurrentIndex(startIndex);
      setCurrentTrack(track);
      addToRecentlyPlayed(track);
      setAudioSource(track.audio_url);
    } catch (error){
      console.warn("playQueue error!", error);
    }
  }

  useEffect(() => {

    if (!audioSource) return;

    const start = async () => {
      try {
        await player.play();
      } catch {}
    };

    start();

  }, [audioSource]);

  const playNext = async () => {
    if (queue.length === 0) return;

    if(repeatMode === "one"){
      await player.seekTo(0);
      await player.play();
      return;
    }

    let nextIndex;

    if(isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
        nextIndex = currentIndex + 1;
        if(nextIndex >= queue.length){
          if(repeatMode === "all") nextIndex = 0;
          else return;
        }
    }
    const nextTrack = queue[nextIndex];
    setCurrentIndex(nextIndex);
    setCurrentTrack(nextTrack);
    setAudioSource(nextTrack.audio_url);
  };

  const playPrevious = async () => {
    if (queue.length === 0) return;
    setCurrentIndex(prev => {
      const prevIndex = prev === 0 ? queue.length - 1 : prev - 1;
      const prevTrack = queue[prevIndex];
      setCurrentTrack(prevTrack);
      setAudioSource(prevTrack.audio_url);
      return prevIndex;
    })
  };


  // -------------------------
  // CONTROLS
  // -------------------------

  const togglePlayPause = async () => {

    if (isPlaying) await player.pause();
    else await player.play();

  };
  
  const seekTo = async (seconds: number) => {
    try {
      await player.seekTo(seconds);
    } catch {}
  };

  const stopTrack = async () => {
    try {
      await player.seekTo(0);
    } catch {}
  };

  useEffect(() => {
    if (!status) return;
    
    if (status.duration && status.currentTime >= status.duration - 0.3){
      playNext();
    }
  }, [status?.currentTime]);

  const resetPlayer = async () => {
    try {
      await player.pause();
      setAudioSource(null);   // 🔥 remove source
      setCurrentTrack(null);
      setQueue([]);
      setCurrentIndex(0);
    } catch (error) {
      console.warn("resetPlayer error:", error);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isPreparing,
        isShuffle,
        player,
        repeatMode,

        playTrack,
        playQueue,

        playNext,
        playPrevious,
        
        togglePlayPause,
        stopTrack,
        resetPlayer,
        seekTo,

        setIsShuffle,
        setRepeatMode
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