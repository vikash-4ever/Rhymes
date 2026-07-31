import { Song } from "@/types/song";
import { MediaItem } from "@rntp/player";

export function songToMediaItem(song: Song): MediaItem {
  return {
    mediaId: song.id,

    url: song.audio_url,

    title: song.title,

    artist: song.artists
      ?.map((artist) => artist.name)
      .join(", "),

    albumTitle: song.album,

    artworkUrl: song.thumbnail_url,

    duration: song.duration_seconds,

    extras: {
      lyricsUrl: song.lyrics_url,
      hasLyrics: song.hasLyrics,
      playCount: song.play_count,
    },
  };
}