import axios from "axios";

export type SongItem = {
  title: string;
  artist: string;
  thumbnail: string;
  url: string;
};

export type SearchResponse = {
  status: "success" | string;
  results: SongItem[];
};

export type PopularResponse = {
  status: "success" | string;
  results: SongItem[];
};

export type RecommendationsResponse = {
  status: "success" | string;
  results: SongItem[];
};

export type ResolveResponse = {
  status: "success" | string;
  audio_url: string;
};

export const getBaseURL = () => {
  return "https://serena-backend-d78o.onrender.com";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 20000,
});

// ------------------------------------------------
// SEARCH
// ------------------------------------------------
export const searchSong = async (
  query: string,
  signal?: AbortSignal
): Promise<SearchResponse> => {
  const res = await API.post<SearchResponse>(
    "/search",
    { query },
    { signal }
  );
  return res.data;
};

// ------------------------------------------------
// POPULAR
// ------------------------------------------------
export const getPopularSongs = async (): Promise<PopularResponse> => {
  const res = await API.get<PopularResponse>("/popular");
  return res.data;
};

// ------------------------------------------------
// RECOMMENDATIONS
// ------------------------------------------------
export const getRecommendations = async (): Promise<RecommendationsResponse> => {
  const res = await API.get<RecommendationsResponse>("/recommendations");
  return res.data;
};

// ------------------------------------------------
// RESOLVE (NEW) — GET DIRECT AUDIO URL
// ------------------------------------------------
export const resolveAudio = async (
  videoUrl: string
): Promise<ResolveResponse> => {
  const res = await API.post<ResolveResponse>("/resolve", {
    url: videoUrl,
  });
  return res.data;
};

// ------------------------------------------------
// REMOVE THESE → stream & download NO LONGER EXIST
// ------------------------------------------------
// export const getStreamUrl = ...
// export const getDownloadUrl = ...

export default {
  searchSong,
  getPopularSongs,
  getRecommendations,
  resolveAudio,
  getBaseURL,
};
