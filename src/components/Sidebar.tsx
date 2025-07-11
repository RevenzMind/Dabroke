import { Voice } from "../types";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  savedVoices: Voice[];
}

const Sidebar = ({ activeTab, setActiveTab, savedVoices }: SidebarProps) => {
  return (
    <div className="sidebar">
      <div className="logo-container">
        <img src="/icons/icon.svg" alt="Logo" />
        <h2>Dabroke</h2>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li className={activeTab === "record" ? "active" : ""}>
            <button onClick={() => setActiveTab("record")}>
              <span className="icon">🎙️</span>
              Record Voice
            </button>
          </li>
          <li className={activeTab === "upload" ? "active" : ""}>
            <button onClick={() => setActiveTab("upload")}>
              <span className="icon">📤</span>
              Upload Audio
            </button>
          </li>
          <li className={activeTab === "voices" ? "active" : ""}>
            <button onClick={() => setActiveTab("voices")}>
              <span className="icon">🔊</span>
              My Voices
              {savedVoices.length > 0 && (
                <span className="voice-count">{savedVoices.length}</span>
              )}
            </button>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <p>© 2025 Dabroke by RawenCat</p>
      </div>
    </div>
  );
};

export default Sidebar;
