import { useState, useRef, useEffect } from "react";
import ProgressBar from "./shared/ProgressBar";
import { useNativeNotification } from "../hooks/useNativeNotification";

interface VoiceRecorderProps {
  onAudioReady: (blob: Blob, fileUrl: string) => void;
}

const VoiceRecorder = ({
  onAudioReady,
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState("00:00");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTooShort, setRecordingTooShort] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(15); // 15 seconds mandatory
  const { showErrorNotification, showSuccessNotification } = useNativeNotification();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioChunksRef.current = [];

        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) =>
          audioChunksRef.current.push(e.data);
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          const elapsed = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );

          if (elapsed < 15) {
            setRecordingTooShort(true);
            await showErrorNotification("Recording must be at least 15 seconds");
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          setRecordingTooShort(false);
          setAudioBlob(blob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorderRef.current.start();
        startTimeRef.current = Date.now();
        setTimeRemaining(15);


        timerRef.current = window.setInterval(() => {
          const elapsed = Math.floor(
            (Date.now() - startTimeRef.current) / 1000
          );
          const minutes = Math.floor(elapsed / 60)
            .toString()
            .padStart(2, "0");
          const seconds = (elapsed % 60).toString().padStart(2, "0");
          setRecordedTime(`${minutes}:${seconds}`);


          const remaining = Math.max(0, 15 - elapsed);
          setTimeRemaining(remaining);


          if (elapsed >= 30 && isRecording) {
            toggleRecording();
          }
        }, 1000);

        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        await showErrorNotification("Error accessing microphone. Please check permissions.");
      }
    } else {
      mediaRecorderRef.current?.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob) {
      await showErrorNotification("No audio recorded to upload");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");

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
      onAudioReady(audioBlob, data.url);
      await showSuccessNotification("Upload successful!");
    } catch (error) {
      await showErrorNotification(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="record-container">
      <div className="record-header">
        <h1>Record Your Voice</h1>
        <p className="record-instructions">
          Record your voice for at least 15 seconds. Clear voice with minimal
          background noise works best.
        </p>
      </div>

      {isRecording && (
        <div className="timer-container">
          <div className="time-remaining">
            {timeRemaining > 0
              ? `Required recording time: ${timeRemaining}s remaining`
              : "Minimum time reached! You can stop now or continue recording."}
          </div>
          <ProgressBar
            progress={Math.min(100, (15 - timeRemaining) * (100 / 15))}
          />
        </div>
      )}

      <div className="voice-recorder">
        <button
          onClick={toggleRecording}
          className={`record-button ${isRecording ? "recording" : ""} ${
            recordingTooShort ? "error" : ""
          }`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? `Stop Recording (${recordedTime})` : "Start Recording"}
        </button>

        {audioBlob && !recordingTooShort && (
          <button
            onClick={uploadAudio}
            disabled={isUploading}
            className="upload-button"
          >
            {isUploading ? "Uploading..." : "Upload Voice"}
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
