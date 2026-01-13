declare module "react-native-ytdl" {
  export interface videoFormat {
    url: string;
    mimeType?: string;
    qualityLabel?: string;
    bitrate?: number;
  }

  export default function ytdl(
    videoUrl: string,
    options?: {
      quality?: string;
      filter?: (format: videoFormat) => boolean;
    }
  ): Promise<videoFormat[]>;
}
