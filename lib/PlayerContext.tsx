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

  addToNextQueue: (song: Song) => void;

  togglePlayPause: () => Promise<void>;
  stopTrack: () => Promise<void>;
  resetPlayer: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  playShuffledQueue: (songs: Song[]) => Promise<void>;

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
      playsInSilentMode: true,
      shouldPlayInBackground:true,
      interruptionMode: "duckOthers",
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
  const startPlayback = async () => {
    if (!audioSource) return;

    try {
      await player.play();
    } catch (error) {
      console.log("Playback error:", error);
    }
  };

  startPlayback();
}, [audioSource, player]);

  const playNext = async () => {
    if (queue.length === 0 || !currentTrack) return;

    if (repeatMode === "one") {
      await player.seekTo(0);
      await player.play();
      return;
    }

    let nextIndex;

    const currentTrackIndex = queue.findIndex(
      (s) => s.id === currentTrack.id
    );

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentTrackIndex + 1;

      if (nextIndex >= queue.length) {
        if (repeatMode === "all") nextIndex = 0;
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

  // Shuffle function for playlists
  const shuffleArray = (array: Song[]) => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  // Shuffle Queue for playlists
  const playShuffledQueue = async (songs: Song[]) => {
  try {
    const shuffled = shuffleArray(songs);

    setQueue(shuffled);
    setCurrentIndex(0);
    setCurrentTrack(shuffled[0]);

    addToRecentlyPlayed(shuffled[0]);

    setAudioSource(shuffled[0].audio_url);
  } catch (error) {
    console.warn("playShuffledQueue error!", error);
  }
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

  const addToNextQueue = (song: Song) => {

    if (!currentTrack) {
      playTrack(song);
      return;
    }

    setQueue((prevQueue) => {

      // remove old occurrence
      const filteredQueue = prevQueue.filter(
        (s) => s.id !== song.id
      );

      // find current track again after filtering
      const currentTrackIndex = filteredQueue.findIndex(
        (s) => s.id === currentTrack.id
      );

      const updatedQueue = [...filteredQueue];

      // insert after current track
      updatedQueue.splice(
        currentTrackIndex + 1,
        0,
        song
      );

      return updatedQueue;
    });
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

        addToNextQueue,
        
        togglePlayPause,
        stopTrack,
        resetPlayer,
        seekTo,
        playShuffledQueue,

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