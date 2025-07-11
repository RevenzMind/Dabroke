import { useState, useRef } from "react";
import { useNativeNotification } from "../hooks/useNativeNotification";

interface AudioUploaderProps {
  onAudioReady: (blob: Blob, fileUrl: string) => void;
}

const AudioUploader = ({
  onAudioReady,
}: AudioUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showErrorNotification, showSuccessNotification } = useNativeNotification();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("audio/")) {
        setSelectedFile(file);

        const blob = new Blob([file], { type: file.type });
        setAudioBlob(blob);
      } else {
        await showErrorNotification("Please select an audio file");
      }
    }
  };

  const uploadAudio = async () => {
    if (!selectedFile) {
      await showErrorNotification("No audio file selected");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "https://dababel-backend.onrender.com/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      onAudioReady(audioBlob!, data.url);
      await showSuccessNotification("Upload successful!");
    } catch (error) {
      await showErrorNotification(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Upload Audio</h1>
        <p>
          Upload an audio file that is at least 15 seconds long. Clear voice
          with minimal background noise works best.
        </p>
      </div>

      <div className="upload-area">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          className="file-input"
          aria-label="Select audio file"
        />

        <div
          className={`file-drop-area ${selectedFile ? "file-selected" : ""}`}
          onClick={triggerFileInput}
        >
          {selectedFile ? (
            <div className="selected-file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <>
              <div className="upload-icon">📁</div>
              <p>Click to select an audio file or drag and drop here</p>
              <p className="file-types">Supported formats: MP3, WAV, M4A</p>
            </>
          )}
        </div>

        <button
          onClick={uploadAudio}
          disabled={!selectedFile || isUploading}
          className={`upload-button ${!selectedFile ? "disabled-button" : ""}`}
        >
          {isUploading ? "Uploading..." : "Upload Audio"}
        </button>
      </div>
    </div>
  );
};

export default AudioUploader;
