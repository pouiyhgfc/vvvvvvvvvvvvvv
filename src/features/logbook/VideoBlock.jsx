import { useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import Button from "../../ui/Button.jsx";
import { TextInput } from "../../ui/Field.jsx";
import Icon from "../../ui/Icon.jsx";
import { videoEmbed } from "./videoEmbed.js";

// Mini-speler: plak een YouTube-, Instagram-, Vimeo- of TikTok-link en de
// video speelt in de notitie. Alleen de link wordt opgeslagen; de speler
// komt van de site zelf, dus zonder internet zie je alleen de link.
export const createVideo = createReactBlockSpec(
  {
    type: "video",
    propSchema: { url: { default: "" } },
    content: "none",
  },
  {
    render: ({ block, editor }) =>
      block.props.url ? (
        <Player url={block.props.url} />
      ) : (
        <LinkForm
          onSave={(url) => editor.updateBlock(block, { props: { url } })}
        />
      ),
    // Export (markdown/body) als link, zodat zoeken en voorbeeld hem zien.
    toExternalHTML: ({ block }) => (
      <p>
        <a href={block.props.url}>{block.props.url}</a>
      </p>
    ),
  },
);

function Player({ url }) {
  const embed = videoEmbed(url);
  return (
    <div contentEditable={false} style={wrap}>
      {embed ? (
        <iframe
          src={embed.src}
          title="Video"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          // YouTube weigert ingesloten video's zonder herkomst.
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            display: "block",
            width: embed.vertical ? "min(100%, 340px)" : "100%",
            aspectRatio: embed.vertical ? "9 / 16" : "16 / 9",
            margin: "0 auto",
            border: "none",
            borderRadius: "var(--r-md)",
            background: "var(--sunken)",
          }}
        />
      ) : (
        <p style={note}>Deze link kan niet in de notitie spelen.</p>
      )}
      <a href={url} target="_blank" rel="noreferrer" style={link}>
        {url}
      </a>
    </div>
  );
}

function LinkForm({ onSave }) {
  const [value, setValue] = useState("");
  const save = () => value.trim() && onSave(value.trim());
  return (
    <div contentEditable={false} style={{ ...wrap, ...form }}>
      <Icon
        name="play-circle"
        size={22}
        style={{ color: "var(--text-muted)" }}
      />
      <TextInput
        type="url"
        value={value}
        placeholder="Plak een link van YouTube, Instagram …"
        aria-label="Videolink"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
        style={{ flex: 1, minWidth: 0 }}
      />
      <Button onClick={save} disabled={!value.trim()}>
        Insluiten
      </Button>
    </div>
  );
}

const wrap = { flex: 1, display: "flex", flexDirection: "column", gap: 6 };
const form = {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  padding: 8,
  borderRadius: "var(--r-md)",
  background: "var(--sunken)",
};
const note = {
  margin: 0,
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
};
const link = {
  fontSize: "var(--fs-xs)",
  color: "var(--text-muted)",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
