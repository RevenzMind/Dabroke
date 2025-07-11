import { useState, useRef } from "react";
import { useDownload } from "../hooks/useDownload";
import { useNativeNotification } from "../hooks/useNativeNotification";

interface TextToSpeechProps {
  voiceId: string;
}

const TextToSpeech = ({ voiceId }: TextToSpeechProps) => {
  const [textToClone, setTextToClone] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { downloadBlob, openVoicesFolder } = useDownload();
  const { showErrorNotification, showSuccessNotification } = useNativeNotification();

  const generateAudio = async () => {
    if (!voiceId || !textToClone) {
      await showErrorNotification("Please select a voice and enter text to convert");
      return;
    }

    setIsGenerating(true);

    try {
      const requestBody = JSON.stringify({
        operationName: "TextToSpeech",
        variables: {
          input: {
            text: textToClone,
            voiceId: voiceId,
            languageCode: "es-mx",
            voiceSettings: {
              stability: 0.5,
              similarityBoost: 0.5,
              style: 0,
              useSpeakerBoost: true,
            },
          },
        },
        query:
          "mutation TextToSpeech($input: TextToSpeechInput!) {\n  textToSpeech(input: $input) {\n    success\n    audioData\n    durationMs\n    error\n    __typename\n  }\n}",
      });

      const response = await fetch(
        "https://dababel-backend.onrender.com/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: requestBody,
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      if (
        data.data?.textToSpeech?.success &&
        data.data?.textToSpeech?.audioData
      ) {
        const audioData = data.data.textToSpeech.audioData;
        const byteCharacters = atob(audioData);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: "audio/mpeg" });

        setGeneratedAudio(audioBlob);

        await showSuccessNotification(`Generated audio (${data.data.textToSpeech.durationMs}ms)`);
      } else {
        throw new Error(
          data.data?.textToSpeech?.error || "Failed to generate audio"
        );
      }
    } catch (error) {
      await showErrorNotification(error instanceof Error ? error.message : "Audio generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedAudio) return;

    try {
      const filePath = await downloadBlob(generatedAudio, "generated-speech");

      if (filePath) {
        const fileName = filePath.split(/[/\\]/).pop() || "audio file";
        await showSuccessNotification(`Audio saved as "${fileName}" in Dabroken Voices folder`);
      } else {
        await showErrorNotification("Failed to save audio file");
      }
    } catch (error) {
      await showErrorNotification("Failed to download audio");
    }
  };

  return (
    <div className="text-to-speech-container">
      {!generatedAudio ? (
        <>
          <h2>Generate Speech from Text</h2>
          <p>Enter text to generate speech with your selected voice clone</p>

          <div className="text-input-container">
            <textarea
              id="generate-input"
              className="text-input"
              placeholder="Enter text to convert to speech"
              aria-label="Text to convert to speech"
              value={textToClone}
              onChange={(e) => setTextToClone(e.target.value)}
              rows={4}
            />

            <div className="button-container">
              <button
                onClick={generateAudio}
                disabled={!textToClone || isGenerating}
                className={
                  !textToClone || isGenerating
                    ? "disabled-button"
                    : "generate-button"
                }
                aria-label="Generate speech from text"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </>
      ) : null}

      {generatedAudio && (
        <div className="generated-audio">
          <h3>Generated Speech</h3>
          <div className="audio-controls">
            <audio
              ref={audioRef}
              src={URL.createObjectURL(generatedAudio)}
              controls
              className="audio-player"
              onPlay={() => audioRef.current?.play()}
            />
            <div className="audio-buttons">
              <button
                className="download-button"
                onClick={handleDownload}
                aria-label="Download generated audio"
              >
                <span className="download-icon">⬇️</span> Download
              </button>
              <button
                className="download-button"
                onClick={async () => {
                  try {
                    await openVoicesFolder();
                    await showSuccessNotification("Opened Dabroken Voices folder");
                  } catch (error) {
                    await showErrorNotification("Failed to open folder");
                  }
                }}
                aria-label="Open Dabroken Voices folder"
              >
                <span className="download-icon">📁</span>Folder
              </button>
              <button
                className="download-button"
                onClick={() => {
                  setGeneratedAudio(null);
                  setTextToClone("");
                }}
                aria-label="Generate another audio"
              >
                <span className="download-icon">🔄</span> New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToSpeech;
