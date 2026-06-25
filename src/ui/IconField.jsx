import { useState } from "react";
import EmojiPicker from "./EmojiPicker.jsx";
import Emoji from "./Emoji.jsx";

// Emoji-knop + uitklapbare picker als één component.
// Plaats in een flex-rij met `flexWrap: "wrap"`: de picker (width 100%) valt dan
// netjes onder de rij i.p.v. ernaast.
export default function IconField({
  value,
  onChange,
  size = 42,
  pickerSize = 28,
  pickerHeight = 150,
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Kies icoon"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: size,
          height: size,
          borderRadius: 9,
          border: "1.5px solid var(--border)",
          background: "var(--input-bg)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Emoji char={value} size={Math.round(size * 0.52)} />
      </button>
      {open && (
        <div style={{ width: "100%", marginTop: 8 }}>
          <EmojiPicker
            value={value}
            onPick={(e) => {
              onChange(e);
              setOpen(false);
            }}
            size={pickerSize}
            height={pickerHeight}
          />
        </div>
      )}
    </>
  );
}
