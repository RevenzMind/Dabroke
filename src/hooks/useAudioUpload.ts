import { useState, useCallback } from "react";
import { UploadStatus } from "../types";

export interface UseAudioUploadOptions {
  onAudioReady?: (blob: Blob, fileUrl: string) => void;
  setUploadStatus?: React.Dispatch<React.SetStateAction<UploadStatus | null>>;
  uploadEndpoint?: string;
}

export const useAudioUpload = ({
  onAudioReady,
  setUploadStatus,
  uploadEndpoint = "https://dababel-backend.onrender.com/upload",
}: UseAudioUploadOptions = {}) => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAudio = useCallback(
    async (audioBlob: Blob, filename: string = "audio") => {
      if (!audioBlob) {
        setUploadStatus?.({
          success: false,
          message: "No audio to upload",
        });
        return null;
      }

      setIsUploading(true);
      setUploadStatus?.(null);

      try {
        const formData = new FormData();
        formData.append("file", audioBlob, `${filename}.wav`);

        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();

        if (onAudioReady) {
          onAudioReady(audioBlob, data.url);
        }

        setUploadStatus?.({
          success: true,
          message: "Upload successful!",
        });

        return data.url;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setUploadStatus?.({
          success: false,
          message: errorMessage,
        });
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [onAudioReady, setUploadStatus, uploadEndpoint]
  );

  return {
    uploadAudio,
    isUploading,
  };
};
