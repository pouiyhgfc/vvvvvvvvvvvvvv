import { createReactBlockSpec } from "@blocknote/react";
import Icon from "../../ui/Icon.jsx";

// Callout: een opvallend blok met icoon en zachte achtergrond. Tik op het
// icoon om te wisselen tussen info, tip en let op. Bewust maar drie
// varianten, via de bestaande kleurtokens (licht/donker vanzelf goed).
const VARIANTS = {
  info: {
    icon: "info",
    label: "Info",
    bg: "var(--sunken)",
    fg: "var(--text-muted)",
  },
  tip: {
    icon: "lightbulb",
    label: "Tip",
    bg: "var(--accent-bg)",
    fg: "var(--accent-text)",
  },
  letop: {
    icon: "warning",
    label: "Let op",
    bg: "var(--danger-bg)",
    fg: "var(--danger-text)",
  },
};
const ORDER = Object.keys(VARIANTS);

export const createCallout = createReactBlockSpec(
  {
    type: "callout",
    propSchema: { variant: { default: "info", values: ORDER } },
    content: "inline",
  },
  {
    render: ({ block, editor, contentRef }) => {
      const v = VARIANTS[block.props.variant] ?? VARIANTS.info;
      const next =
        ORDER[(ORDER.indexOf(block.props.variant) + 1) % ORDER.length];
      return (
        <div
          className="callout"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "10px 12px",
            borderRadius: "var(--r-md)",
            background: v.bg,
          }}
        >
          <button
            type="button"
            contentEditable={false}
            aria-label={`${v.label} (tik om te wisselen)`}
            onClick={() =>
              editor.updateBlock(block, { props: { variant: next } })
            }
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              marginTop: -2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              background: "transparent",
              color: v.fg,
              padding: 0,
            }}
          >
            <Icon name={v.icon} size={20} />
          </button>
          <div ref={contentRef} style={{ flex: 1, minWidth: 0 }} />
        </div>
      );
    },
    // Export (markdown/body) als citaat, zodat zoeken en voorbeeld de tekst zien.
    toExternalHTML: ({ contentRef }) => <blockquote ref={contentRef} />,
  },
);
