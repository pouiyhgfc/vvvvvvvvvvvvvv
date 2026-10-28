import { bodyPreview } from "../../lib/notes.js";
import Emoji from "../../ui/Emoji.jsx";
import Icon from "../../ui/Icon.jsx";

// Eén notitie in het archief of de prullenbak: notitieboek, titel en een
// paar icoonknoppen. Met `onOpen` is de rij zelf aan te tikken.
export default function NoteRow({ entry, notebook, onOpen, actions }) {
  const text = (
    <>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: "var(--fs-xs)",
          color: "var(--text-muted)",
        }}
      >
        <Emoji char={notebook.icon} size={14} />
        {notebook.name}
      </span>
      <span
        dir="auto"
        style={{
          display: "block",
          fontSize: "var(--fs-md)",
          color: "var(--text)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {entry.title || bodyPreview(entry.body) || "Zonder titel"}
      </span>
    </>
  );
  const textStyle = {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: 2,
    textAlign: "start",
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          style={{
            ...textStyle,
            border: "none",
            background: "transparent",
            padding: 0,
          }}
        >
          {text}
        </button>
      ) : (
        <div style={textStyle}>{text}</div>
      )}
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={a.onClick}
          aria-label={a.label}
          title={a.label}
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: "var(--r-pill)",
            background: "transparent",
            color: "var(--text-muted)",
            padding: 0,
            flexShrink: 0,
          }}
        >
          <Icon name={a.icon} size={20} />
        </button>
      ))}
    </div>
  );
}
