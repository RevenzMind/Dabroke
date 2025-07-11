import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./styles/index.css";

import Sidebar from "./components/Sidebar";
import VoiceRecorder from "./components/VoiceRecorder";
import AudioUploader from "./components/AudioUploader";
import VoiceCloner from "./components/VoiceCloner";
import SavedVoices from "./components/SavedVoices";

import { Voice } from "./types";
import { useNativeNotification } from "./hooks/useNativeNotification";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("record");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [savedVoices, setSavedVoices] = useState<Voice[]>([]);
  const [showCloner, setShowCloner] = useState(false);
  const { showSuccessNotification, showErrorNotification } = useNativeNotification();

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const voices = await invoke<any[]>("get_voices");
        if (voices && Array.isArray(voices)) {
          const formattedVoices: Voice[] = voices.map((voice) => ({
            id: voice.id,
            name: voice.name,
            voiceId: voice.voice_id,
            createdAt: voice.created_at,
          }));
          setSavedVoices(formattedVoices);
        }
      } catch (error) {
        console.error("Failed to load saved voices:", error);
      }
    };

    loadVoices();
  }, []);

  const handleAudioReady = (blob: Blob, url: string) => {
    setAudioBlob(blob);
    setFileUrl(url);
    setShowCloner(true);
  };

  const handleVoiceCreated = (voice: Voice) => {
    setSavedVoices((prev) => [...prev, voice]);
    setActiveTab("voices");
    setShowCloner(false);
  };

  const handleDeleteVoice = async (id: string) => {
    try {
      await invoke("delete_voice", { id });

      setSavedVoices((prev) => prev.filter((voice) => voice.id !== id));

      await showSuccessNotification("Voice deleted successfully");
    } catch (error) {
      console.error("Failed to delete voice:", error);
      await showErrorNotification("Failed to delete voice");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "record":
        return (
          <>
            {!showCloner && (
              <VoiceRecorder
                onAudioReady={handleAudioReady}
              />
            )}
            {showCloner && (
              <VoiceCloner
                fileUrl={fileUrl}
                audioBlob={audioBlob}
                onVoiceCreated={handleVoiceCreated}
              />
            )}
          </>
        );
      case "upload":
        return (
          <>
            {!showCloner && (
              <AudioUploader
                onAudioReady={handleAudioReady}
              />
            )}
            {showCloner && (
              <VoiceCloner
                fileUrl={fileUrl}
                audioBlob={audioBlob}
                onVoiceCreated={handleVoiceCreated}
              />
            )}
          </>
        );
      case "voices":
        return (
          <SavedVoices
            voices={savedVoices}
            onDeleteVoice={handleDeleteVoice}
          />
        );
      default:
        return <div>Select an option from the sidebar</div>;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedVoices={savedVoices}
      />

      <main className="content-area">{renderContent()}</main>
    </div>
  );
}
