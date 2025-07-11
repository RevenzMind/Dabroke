import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

export const useDownload = () => {
  const downloadAudioFile = useCallback(
    async (
      base64Data: string,
      filename: string = "generated-speech"
    ): Promise<string | null> => {
      try {
        const filePath = await invoke<string>("save_audio_from_base64", {
          base64Data,
          filename,
        });

        console.log(`Audio file saved to: ${filePath}`);
        return filePath;
      } catch (error) {
        console.error("Failed to download file:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to save audio file"
        );
      }
    },
    []
  );

  const downloadBlob = useCallback(
    async (
      blob: Blob,
      filename: string = "audio-file"
    ): Promise<string | null> => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const mimeType = blob.type || "audio/wav";
        const extension = mimeType.split("/")[1] || "wav";

        const filePath = await invoke<string>("save_audio", {
          audioData: Array.from(bytes),
          filename: `${filename}.${extension}`,
        });

        console.log(`Audio blob saved to: ${filePath}`);
        return filePath;
      } catch (error) {
        console.error("Failed to download blob:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to save audio blob"
        );
      }
    },
    []
  );

  const downloadUrl = useCallback(
    async (
      url: string,
      filename: string = "downloaded-file"
    ): Promise<string | null> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch file: ${response.status} ${response.statusText}`
          );
        }

        const blob = await response.blob();
        return await downloadBlob(blob, filename);
      } catch (error) {
        console.error("Failed to download from URL:", error);
        throw new Error(
          error instanceof Error ? error.message : "Failed to download from URL"
        );
      }
    },
    [downloadBlob]
  );

  const openVoicesFolder = useCallback(async (): Promise<boolean> => {
    try {
      await invoke("open_voices_folder");
      console.log("Opened Dabroken Voices folder");
      return true;
    } catch (error) {
      console.error("Failed to open voices folder:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to open voices folder"
      );
    }
  }, []);

  return {
    downloadAudioFile,
    downloadBlob,
    downloadUrl,
    openVoicesFolder,
  };
};
