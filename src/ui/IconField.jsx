import { useState } from "react";
import EmojiPicker from "./EmojiPicker.jsx";
import Emoji from "./Emoji.jsx";

// Icoonknop + uitklapbare kiezer als één component.
// Plaats in een flex-rij met `flexWrap: "wrap"`: de kiezer (width 100%) valt
// dan netjes onder de rij i.p.v. ernaast.
export default function IconField({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Kies icoon"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "var(--r-sm)",
          border: open ? "2px solid var(--accent)" : "none",
          background: "var(--accent-bg)",
          color: "var(--accent-text)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Emoji char={value} size={24} />
      </button>
      {open && (
        <div style={{ width: "100%", marginTop: "var(--sp-2)" }}>
          <EmojiPicker
            value={value}
            onPick={(e) => {
              onChange(e);
              setOpen(false);
            }}
          />
        </div>
      )}
    </>
  );
}
