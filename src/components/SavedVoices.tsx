import { useState } from "react";
import { Voice } from "../types";
import TextToSpeech from "./TextToSpeech";

interface SavedVoicesProps {
  voices: Voice[];
  onDeleteVoice?: (id: string) => void;
}

const SavedVoices = ({
  voices,
  onDeleteVoice,
}: SavedVoicesProps) => {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);

  if (voices.length === 0) {
    return (
      <div className="saved-voices-container empty">
        <div className="empty-state">
          <div className="empty-icon">🔊</div>
          <h2>No Voices Yet</h2>
          <p>Record or upload audio and create a voice clone to see it here.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!selectedVoice && (
        <div className="saved-voices-container">
          <div className="voices-header">
            <h2>Saved Voices</h2>
            <p>Select a voice to create speech or delete it.</p>
          </div>
          <div className="voices-layout">
            <div className="voices-list">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  className={`voice-card`}
                  onClick={() => setSelectedVoice(voice)}
                >
                  <div className="voice-icon">🎤</div>
                  <div className="voice-info">
                    <h3>{voice.name.substring(0, 10)}</h3>
                    <p className="voice-date">
                      Created: {new Date(voice.createdAt).toLocaleDateString()}
                    </p>
                    <p className="voice-id">
                      ID: {voice.voiceId.substring(0, 8)}...
                    </p>
                  </div>
                  {onDeleteVoice && (
                    <button
                      className="delete-voice"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${voice.name}"?`
                          )
                        ) {
                          onDeleteVoice(voice.id);
                        }
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {selectedVoice ? (
        <div className="voice-detail">
          <div className="selected-voice-content">
            <div className="selected-voice-header">
              <div className="voice-header-top">
                <button
                  className="back-button"
                  onClick={() => setSelectedVoice(null)}
                  aria-label="Back to voice list"
                >
                  Back to Voices
                </button>
              </div>
              <div className="voice-header-content">
                <h2>{selectedVoice.name.substring(0, 15)}</h2>
                <p>Create speech with this voice</p>
              </div>
            </div>
            <TextToSpeech
              voiceId={selectedVoice.voiceId}
            />
          </div>
        </div>
      ) : null}
    </>
  );
};

export default SavedVoices;
