import React from "react";
import ReactDOM from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import "./styles/index.css";
import App from "./App";
const Header = () => (
  <div
    data-tauri-drag-region
    className="controlbox"
    onDoubleClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
  >
    <div className="controlbox-buttons">
      <button onClick={() => invoke("minimize_app")}></button>
      <button disabled></button>
      <button onClick={() => invoke("close_app")}></button>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Header />
    <App />
  </React.StrictMode>
);
