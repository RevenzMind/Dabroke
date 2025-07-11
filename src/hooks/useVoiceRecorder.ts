import { useState, useRef, useEffect, useCallback } from "react";
import { UploadStatus } from "../types";

export interface UseVoiceRecorderOptions {
  minRecordingTime?: number;
  maxRecordingTime?: number;
  setUploadStatus?: React.Dispatch<React.SetStateAction<UploadStatus | null>>;
}

export const useVoiceRecorder = ({
  minRecordingTime = 15,
  maxRecordingTime = 30,
  setUploadStatus,
}: UseVoiceRecorderOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState("00:00");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(minRecordingTime);
  const [recordingTooShort, setRecordingTooShort] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
    }
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      audioChunksRef.current = [];
      setRecordingTooShort(false);
      setAudioBlob(null);

      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

        if (elapsed < minRecordingTime) {
          setRecordingTooShort(true);
          setUploadStatus?.({
            success: false,
            message: `Recording must be at least ${minRecordingTime} seconds`,
          });
        } else {
          setRecordingTooShort(false);
          setAudioBlob(blob);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      startTimeRef.current = Date.now();
      setTimeRemaining(minRecordingTime);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordedTime(formatTime(elapsed));

        const remaining = Math.max(0, minRecordingTime - elapsed);
        setTimeRemaining(remaining);

        if (elapsed >= maxRecordingTime) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setUploadStatus?.({
        success: false,
        message: "Error accessing microphone. Please check permissions.",
      });
    }
  }, [
    minRecordingTime,
    maxRecordingTime,
    setUploadStatus,
    formatTime,
    stopRecording,
  ]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setRecordedTime("00:00");
    setTimeRemaining(minRecordingTime);
    setRecordingTooShort(false);
  }, [minRecordingTime]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const progress =
    timeRemaining > 0
      ? Math.min(
          100,
          (minRecordingTime - timeRemaining) * (100 / minRecordingTime)
        )
      : 100;

  return {
    isRecording,
    recordedTime,
    audioBlob,
    timeRemaining,
    recordingTooShort,
    progress,
    toggleRecording,
    resetRecording,
    canUpload: audioBlob && !recordingTooShort,
  };
};
