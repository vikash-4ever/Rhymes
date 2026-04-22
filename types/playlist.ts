export type Playlist = {
    $id: string;
    name: string;
    userId: string;
    songIds: string[];
    coverImage?: string;
    $createdAt?: string;
    $updatedAt?: string;
};
