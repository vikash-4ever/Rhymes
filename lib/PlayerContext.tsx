import { Song } from "@/types/song";
import TrackPlayer, { PlaybackState, RepeatMode, useActiveMediaItem, useIsPlaying, usePlaybackState } from "@rntp/player";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import ImageColors from "react-native-image-colors";
import { useGlobalContext } from "./global-provider";
import { songToMediaItem } from "./player/songToMediaPlayer";

export type QueueContext = {
    type:
        | "recent"
        | "trending"
        | "editorsPick"
        | "search"
        | "artist"
        | "category"
        | "playlist"
        | "liked"
        | "local"
        | "recommendation";

    title: string;

    route:
        | "/(root)/(tabs)/home/listScreen"
        | "/(root)/(tabs)/search/listScreen"
        | "/(root)/(tabs)/favourites/listScreen";

    params?: Record<string, unknown>;
}

export type NavigationContext = {
    route:
        | "/(root)/(tabs)/home/listScreen"
        | "/(root)/(tabs)/search/listScreen"
        | "/(root)/(tabs)/favourites/listScreen";

    source:
        | "home"
        | "search"
        | "favourites";
}

type PlayerContextType = {
  currentTrack: Song | null;
  pendingTrack: Song | null;
  dominantColor: string;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: "off" | "one" | "all";
  isPreparing:boolean;

  queueContext: QueueContext;
  navigationContext: NavigationContext;

  playTrack: (track: Song) => Promise<void>;
  playQueue: (songs: Song[], startIndex: number, queueContext?: QueueContext) => Promise<void>;

  setPendingTrack: React.Dispatch<React.SetStateAction<Song | null>>;
  setQueueContext: React.Dispatch<React.SetStateAction<QueueContext>>;
  setNavigationContext: React.Dispatch<React.SetStateAction<NavigationContext>>;

  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;

  addToNextQueue: (song: Song) => Promise<void>;

  togglePlayPause: () => Promise<void>;
  stopTrack: () => Promise<void>;
  resetPlayer: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  playShuffledQueue: (songs: Song[], queueContext?: QueueContext) => Promise<void>;

  toggleShuffle: () => Promise<void>;
  toggleRepeatMode: () => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | null>(null);

const colorCache = new Map<string, string>();


export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  
  const {user, recentlyPlayed, setRecentlyPlayed } = useGlobalContext();
  
  useEffect(() => {
    const initializeTrackPlayer = async () => {
      try {
        await TrackPlayer.setupPlayer({
          contentType: "music",
          handleAudioBecomingNoisy: true,
        });

      } catch (error) {
        console.error("❌ TrackPlayer setup failed:", error);
      }
    };

    initializeTrackPlayer();
  }, []);

  useEffect(() => {
    const mode = TrackPlayer.getRepeatMode();

    switch (mode) {
      case RepeatMode.Off:
        setRepeatMode("off");
        break;

      case RepeatMode.One:
        setRepeatMode("one");
        break;

      case RepeatMode.All:
        setRepeatMode("all");
        break;
    }
  }, []);

  const activeMediaItem = useActiveMediaItem();
  const playbackState = usePlaybackState();
  const isPreparing = playbackState === PlaybackState.Buffering;
  const isPlaying = useIsPlaying();

  useEffect(() => {
    if (!activeMediaItem) {
        setCurrentTrack(null);
        setCurrentIndex(0);
        return;
    }

    const song = queueRef.current.find(
        s => s.id === activeMediaItem.mediaId
    );

    if (!song) {
        return;
    }

    setCurrentTrack(song);
    setPendingTrack(prev =>
      prev?.id === song.id ? null : prev
    );

    const index = queueRef.current.findIndex(
        s => s.id === song.id
    );

    if (index >= 0) {
        setCurrentIndex(index);
    }
  }, [activeMediaItem]);

  
  useEffect(() => {
    if (!user) {
      resetPlayer();
    }
  }, [user]);


  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);

  const [dominantColor, setDominantColor] = useState("#000000");

  const [queue, setQueue] = useState<Song[]>([]);

  const originalQueueRef = useRef<Song[]>([]);

  const [pendingTrack, setPendingTrack] = useState<Song | null>(null);

  const artworkTrack = pendingTrack ?? currentTrack;

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [isShuffle, setIsShuffle] = useState(false);

  const [repeatMode, setRepeatMode] = useState<"off" | "one" | "all">("off");

  const queueRef = useRef<Song[]>([]);

  const [queueContext, setQueueContext] = useState<QueueContext>({
    type: "recent",
    title: "Recent",
    route: "/(root)/(tabs)/home/listScreen",
  });

  const [navigationContext, setNavigationContext] =
    useState<NavigationContext>({
        route: "/(root)/(tabs)/home/listScreen",
        source: "home",
    });

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  
  useEffect(() => {
    let cancelled = false;

    const extractColor = async () => {
      if (!artworkTrack?.thumbnail_url) {
        if (!cancelled) {
          setDominantColor("#000000");
        }
        return;
      }

      // cache hit
      const cached = colorCache.get(artworkTrack.thumbnail_url);

      if (cached) {
        if (!cancelled) {
          setDominantColor(cached);
        }
        return;
      }

      try {
        const result = await ImageColors.getColors(
          artworkTrack.thumbnail_url,
          {
            fallback: "#000000",
          }
        );

        let color = "#000000";

        if (result.platform === "android") {
          color = result.dominant || "#000000";
        } else if (result.platform === "ios") {
          color = result.background || "#000000";
        }

        colorCache.set(artworkTrack.thumbnail_url, color);

        if (!cancelled) {
          setDominantColor(color);
        }
      } catch {
        if (!cancelled) {
          setDominantColor("#000000");
        }
      }
    };

    extractColor();

    return () => {
      cancelled = true;
    };
  }, [artworkTrack]);
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
      setPendingTrack(track);
      setQueue([track]);
      queueRef.current = [track];
      originalQueueRef.current = [track];
      setIsShuffle(false);
      setCurrentIndex(0);
      addToRecentlyPlayed(track);
      await TrackPlayer.setMediaItem(songToMediaItem(track));
      await TrackPlayer.play();

    } catch (err) {
      console.warn("playTrack error:", err);
    }
  };

  const playQueue = async (songs: Song[], startIndex: number, queueContext?: QueueContext) => {
    try{
      const track = songs?.[startIndex];
      if (!track) {
        console.warn("playqueue : invalid track/index",{
          startIndex,
          songsLength: songs?.length,
        })
        return;
      }
      setPendingTrack(track);
      setQueue(songs);
      if(queueContext) {
        setQueueContext(queueContext);
      }
      queueRef.current = songs;
      originalQueueRef.current = songs;

      const mediaItems = songs.map(songToMediaItem);
      await TrackPlayer.setMediaItems(mediaItems, startIndex);
      await TrackPlayer.play();

      setIsShuffle(false);
      setCurrentIndex(startIndex);
      addToRecentlyPlayed(track);
    } catch (error){
      console.warn("playQueue error!", error);
    }
  }

  const playNext = async () => {
    await TrackPlayer.skipToNext();
  };

  const playPrevious = async () => {
    await TrackPlayer.skipToPrevious();
  };


  // -------------------------
  // CONTROLS
  // -------------------------

  const togglePlayPause = async () => {

    if (isPlaying) {
      await TrackPlayer.pause();
    }else {
      await TrackPlayer.play();
    }
  };
  
  const seekTo = async (seconds: number) => {
    try {
      await TrackPlayer.seekTo(seconds);
    } catch {}
  };

  const toggleRepeatMode = async () => {
    let nextMode: "off" | "one" | "all";

    switch (repeatMode) {
        case "off":
            nextMode = "one";
            break;

        case "one":
            nextMode = "all";
            break;

        default:
            nextMode = "off";
    }

    
    switch (nextMode) {
      case "off":
        await TrackPlayer.setRepeatMode(RepeatMode.Off);
        break;
        
      case "one":
        await TrackPlayer.setRepeatMode(RepeatMode.One);
        break;
          
       case "all":
        await TrackPlayer.setRepeatMode(RepeatMode.All);
        break;
    }
    setRepeatMode(nextMode);
    console.log(
      "Repeat:",
      TrackPlayer.getRepeatMode()
    );
  };

  const stopTrack = async () => {
    try {
      await TrackPlayer.seekTo(0);
    } catch {}
  };

  // Shuffle function for playlists
  const shuffleArray = (array: Song[]) => {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] = [
        shuffled[j],
        shuffled[i],
      ];
    }

    return shuffled;
  };

  const toggleShuffle = async () => {
    if (!currentTrack) return;

    const reorderQueue = async (targetQueue: Song[]) => {
      const currentQueue = [...queueRef.current];
      for (let targetIndex = 0; targetIndex < targetQueue.length; targetIndex++) {
        const targetSong = targetQueue[targetIndex];

        const currentIndex = currentQueue.findIndex(
          song => song.id === targetSong.id
        );

        if (currentIndex === -1) continue;

        if (currentIndex === targetIndex) continue;
        
        await TrackPlayer.moveMediaItem(
          currentIndex,
          targetIndex
        );

        // Keep our local copy in sync
        const [movedSong] = currentQueue.splice(currentIndex, 1);

        currentQueue.splice(
          targetIndex,
          0,
          movedSong
        );
      }
    };

    if (!isShuffle) {
      // Enable shuffle

      const currentQueue = queueRef.current;

      const current = currentIndex;

      if (current < 0) return;

      const before = currentQueue.slice(0, current + 1);

      const after = shuffleArray(currentQueue.slice(current + 1));

      const shuffledQueue = [
        ...before,
        ...after,
      ];

      await reorderQueue(shuffledQueue);

      setQueue(shuffledQueue);
      setCurrentIndex(current);
      setIsShuffle(true);

    } else {
        // Disable shuffle
      const index =
        originalQueueRef.current.findIndex(
          song => song.id === currentTrack.id
        );

      if (index < 0) return;

      await reorderQueue(originalQueueRef.current);

      setQueue(originalQueueRef.current);
      setCurrentIndex(index);
      setIsShuffle(false);
    }
  };

  // Shuffle Queue for playlists
  const playShuffledQueue = async (songs: Song[], queueContext?: QueueContext) => {
    try {
      const shuffled = shuffleArray(songs);

      if (!shuffled[0]) return;
      const mediaItems = shuffled.map(songToMediaItem);

      await TrackPlayer.setMediaItems(mediaItems, 0);
      await TrackPlayer.play();

      setQueue(shuffled);
      setIsShuffle(true);
      if(queueContext) {
        setQueueContext(queueContext);
      }
      originalQueueRef.current = songs;
      setCurrentIndex(0);
      addToRecentlyPlayed(shuffled[0]);
    } catch (error) {
      console.warn("playShuffledQueue error!", error);
    }
  };

  const resetPlayer = async () => {
    try {
      await TrackPlayer.stop();
      setCurrentTrack(null);
      setPendingTrack(null);
      setDominantColor("#000000");
      setQueue([]);
      setIsShuffle(false);
      originalQueueRef.current = [];
      setCurrentIndex(0);
    } catch (error) {
      console.warn("resetPlayer error:", error);
    }
  };

  const addToNextQueue = async (song: Song) => {
    if (!currentTrack) {
      await playTrack(song);
      return;
    }

    // Current song doesn't need "Play Next"
    if (song.id === currentTrack.id) {
      return;
    }

    const currentQueue = [...queueRef.current];

    const currentTrackIndex = currentQueue.findIndex(
      (s) => s.id === currentTrack.id
    );

    if (currentTrackIndex === -1) return;

    const existingIndex = currentQueue.findIndex(
      (s) => s.id === song.id
    );

    // Already next
    if (existingIndex === currentTrackIndex + 1) {
      return;
    }

    if (existingIndex >= 0) {
      // Song already exists -> move it
      await TrackPlayer.moveMediaItem(
        existingIndex,
        currentTrackIndex + 1
      );

      const [movedSong] = currentQueue.splice(existingIndex, 1);

      // If song was before current song,
      // removing it shifts current index left by one.
      const insertIndex =
        existingIndex < currentTrackIndex
          ? currentTrackIndex
          : currentTrackIndex + 1;

      currentQueue.splice(insertIndex, 0, movedSong);

    } else {
      // Song not in queue -> insert it
      await TrackPlayer.insertMediaItem(
        currentTrackIndex + 1,
        songToMediaItem(song)
      );

      currentQueue.splice(
        currentTrackIndex + 1,
        0,
        song
      );
    }

    queueRef.current = currentQueue;
    setQueue(currentQueue);

    const updatedCurrentIndex = currentQueue.findIndex(
      s => s.id === currentTrack.id
    );

    if (updatedCurrentIndex !== currentIndex) {
      setCurrentIndex(updatedCurrentIndex);
    }
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        dominantColor,
        isPlaying,
        isShuffle,
        repeatMode,
        isPreparing,
        queueContext,

        playTrack,
        playQueue,

        playNext,
        playPrevious,
        pendingTrack,
        addToNextQueue,
        
        togglePlayPause,
        stopTrack,
        resetPlayer,
        seekTo,
        playShuffledQueue,
        toggleShuffle,
        toggleRepeatMode,
        setPendingTrack,
        setQueueContext,
        navigationContext,
        setNavigationContext
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