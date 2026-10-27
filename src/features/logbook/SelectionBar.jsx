import Emoji from "../../ui/Emoji.jsx";
import { metaBtn } from "./noteHelpers.js";

// Actiebalk onderin zolang er notities geselecteerd zijn.
export default function SelectionBar({ onPin, onArchive, onMove, onTrash }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 150,
        display: "flex",
        justifyContent: "center",
        gap: 8,
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom))",
        background: "var(--card)",
        borderTop: "1px solid var(--border-mid)",
        boxShadow: "0 -2px 10px var(--shadow)",
      }}
    >
      <button
        onClick={onPin}
        aria-label="Vastzetten"
        title="Vastzetten"
        style={{ ...metaBtn, width: 44, height: 44 }}
      >
        <Emoji char="📌" size={18} />
      </button>
      <button
        onClick={onArchive}
        aria-label="Archiveren"
        title="Archiveren"
        style={{ ...metaBtn, width: 44, height: 44 }}
      >
        <Emoji char="🗄️" size={18} />
      </button>
      <button
        onClick={onMove}
        aria-label="Verplaatsen naar…"
        title="Verplaatsen naar…"
        style={{ ...metaBtn, width: 44, height: 44 }}
      >
        <Emoji char="📂" size={18} />
      </button>
      <button
        onClick={onTrash}
        aria-label="Naar prullenbak"
        title="Naar prullenbak"
        style={{ ...metaBtn, width: 44, height: 44 }}
      >
        <Emoji char="🗑️" size={18} />
      </button>
    </div>
  );
}
