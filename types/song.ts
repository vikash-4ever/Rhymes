export interface Song {
 id: string
 title: string
 album: string
 audio_url: string
 thumbnail_url: string
 lyrics_url: string
 duration_seconds: number
 play_count: number
 artists: { name: string }[]
}