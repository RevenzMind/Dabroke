import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { invoke } from "@tauri-apps/api/core";
import { Voice } from "../types";
import { useNativeNotification } from "../hooks/useNativeNotification";

interface VoiceClonerProps {
  fileUrl: string;
  audioBlob: Blob | null;
  onVoiceCreated: (voice: Voice) => void;
}

const VoiceCloner = ({
  fileUrl,
  audioBlob,
  onVoiceCreated,
}: VoiceClonerProps) => {
  const [cloneName, setCloneName] = useState<string>("");
  const [isCloning, setIsCloning] = useState(false);
  const { showErrorNotification, showSuccessNotification } = useNativeNotification();

  const cloneVoice = async () => {
    if (!audioBlob || !cloneName || !fileUrl) {
      await showErrorNotification("Please record/upload audio and enter a clone name");
      return;
    }

    setIsCloning(true);

    try {
      const response = await fetch(
        "https://dababel-backend.onrender.com/graphql",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "*/*",
          },
          body: JSON.stringify({
            operationName: "CreateVoiceCloneWithoutUser",
            variables: {
              input: {
                voiceName: cloneName,
                audioUri: fileUrl,
                description: `Voice clone created on ${new Date().toLocaleDateString()}`,
              },
            },
            query:
              "mutation CreateVoiceCloneWithoutUser($input: CreateVoiceCloneInput!) {\n  createVoiceCloneWithoutUser(input: $input) {\n    error\n    success\n    voice_id\n    __typename\n  }\n}",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();

      if (
        data.data &&
        data.data.createVoiceCloneWithoutUser &&
        data.data.createVoiceCloneWithoutUser.voice_id
      ) {
        const voiceId = data.data.createVoiceCloneWithoutUser.voice_id;


        const newVoice: Voice = {
          id: uuidv4(),
          name: cloneName,
          voiceId: voiceId,
          createdAt: new Date().toISOString(),
        };


        await invoke("save_voice", {
          voice: {
            id: newVoice.id,
            name: newVoice.name,
            voice_id: newVoice.voiceId,
            created_at: newVoice.createdAt,
          },
        });


        onVoiceCreated(newVoice);

        await showSuccessNotification("Voice cloned successfully! You can now generate audio with it.");
      } else {
        throw new Error("Failed to get voice ID from response");
      }
    } catch (error) {
      await showErrorNotification(error instanceof Error ? error.message : "Clone failed");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="clone-container">
      <h2>Create Your Voice Clone</h2>
      <p>Give your voice clone a name to identify it later</p>

      <div className="clone-action-container">
        <input
          type="text"
          id="clone-name-input"
          className="w-11-input"
          placeholder="Clone Name"
          aria-label="Clone name"
          value={cloneName}
          onChange={(e) => setCloneName(e.target.value)}
        />
        <button
          type="button"
          onClick={cloneVoice}
          disabled={!cloneName || isCloning}
          className={!cloneName || isCloning ? "disabled-button" : ""}
        >
          {isCloning ? "Creating Clone..." : "Create Voice Clone"}
        </button>
      </div>
    </div>
  );
};

export default VoiceCloner;
