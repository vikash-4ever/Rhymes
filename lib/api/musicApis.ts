const API_BASE = process.env.EXPO_PUBLIC_API_URL;

/* ---------------- HOME ---------------- */

export const getHome = async () => {
  const res = await fetch(`${API_BASE}/`);
  return res.json();
};

export const getHealth = async () => {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
};

/* ---------------- SONGS ---------------- */

export const getSongs = async (skip = 0, limit = 20) => {
  const res = await fetch(`${API_BASE}/songs?skip=${skip}&limit=${limit}`);
  return res.json();
};

export const getSong = async (songId: string) => {
  const res = await fetch(`${API_BASE}/songs/${songId}`);
  return res.json();
};

export const getSongsByIds = async (ids: string[]) => {
  const res = await fetch(`${API_BASE}/songs/by-ids`, {
    method: "POST",
    headers: {
      "Content-Type" : "application/json",
    },
    body: JSON.stringify(ids),
  });
  return res.json();
}

/* ---------------- SEARCH ---------------- */       //_________________APPLIED______________

export const searchSongs = async (query: string) => {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  return res.json();
};

/* ---------------- PLAY COUNT ---------------- */   //_________________APPLIED______________

export const incrementPlay = async (songId: string) => {
  const res = await fetch(`${API_BASE}/play/${songId}`, {
    method: "POST",
  });
  return res.json();
};

/* ---------------- DISCOVERY ---------------- */    //_________________APPLIED______________

export const getRecommendations = async ({
  likedSongIds,
  recentSongIds,
  likedArtists,
  limit = 20,
}: {
  likedSongIds: string[];
  recentSongIds: string[];
  likedArtists: string[];
  limit?: number;
}) => {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      likedSongIds,
      recentSongIds,
      likedArtists,
      limit,
    }),
  });

  const data = await res.json();

  return data;


};

export const getTrendingSongs = async (limit = 20) => {
  const res = await fetch(`${API_BASE}/trending?limit=${limit}`);
  return res.json();
};
//_________________APPLIED______________
export const getRecentSongs = async (limit = 20) => {
  const res = await fetch(`${API_BASE}/recent?limit=${limit}`);
  return res.json();
};

export const getShuffleSongs = async (limit = 20) => {
  const res = await fetch(`${API_BASE}/shuffle?limit=${limit}`);
  return res.json();
};

/* ---------------- ARTISTS ---------------- */

export const getSongsByArtist = async (artistName: string) => {
  const res = await fetch(
    `${API_BASE}/artist/${encodeURIComponent(artistName)}`
  );
  return res.json();
};

export const getArtists = async () => {
  const res = await fetch(`${API_BASE}/artists`);
  return res.json();
};

export const getArtistImage = async (artistName: string) => {
  try {
    const res = await fetch(
      `${API_BASE}/artist-image/${encodeURIComponent(artistName)}`);

    const data = await res.json();

    return data?.image_url || null;
    
  } catch (error) {
    console.log("Artist image error:", error);
    return null;
  }
};

/* ---------------- ALBUMS ---------------- */

export const getSongsByAlbum = async (albumName: string) => {
  const res = await fetch(
    `${API_BASE}/album/${encodeURIComponent(albumName)}`
  );
  return res.json();
};

export const getAlbums = async () => {
  const res = await fetch(`${API_BASE}/albums`);
  return res.json();
};

/* ---------------- CATEGORIES ---------------- */

export const getSongsByCategory = async (
  category: string
) => {

  const url =
    `${API_BASE}/songs/category/${encodeURIComponent(category)}`;

  console.log("CATEGORY URL =", url);

  const response = await fetch(url);

  console.log("STATUS =", response.status);

  return await response.json();
};