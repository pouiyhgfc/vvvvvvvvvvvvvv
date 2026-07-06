import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { showToast } from "../../lib/toast.js";
import {
  setBlockType,
  toggleStyle,
  setBlockColor,
  moveUp,
  moveDown,
  duplicateBlock,
  copyBlock,
  removeBlock,
} from "./editorActions.js";
import {
  TABLE_ACTIONS,
  runTableCommand,
  deleteTable,
} from "./tableCommands.js";

// "Turn into" — de bloktypes die het slash-menu ook aanbiedt.
const TYPES = [
  { label: "Tekst", type: "paragraph" },
  { label: "Kop 1", type: "heading", props: { level: 1 } },
  { label: "Kop 2", type: "heading", props: { level: 2 } },
  { label: "Kop 3", type: "heading", props: { level: 3 } },
  { label: "Opsomming", type: "bulletListItem" },
  { label: "Genummerd", type: "numberedListItem" },
  { label: "Checklist", type: "checkListItem" },
  { label: "Citaat", type: "quote" },
  { label: "Code", type: "codeBlock" },
];

// BlockNote's eigen highlight-namen. De hexen komen 1-op-1 uit BlockNote's
// stylesheet (data-kleuren, geen thema-tokens) — er bestaan geen CSS-vars
// voor, dus de stippen tonen de letterlijke achtergrond die het blok krijgt.
const COLORS = [
  { label: "Geen", value: "default", hex: null },
  { label: "Grijs", value: "gray", hex: "#ebeced" },
  { label: "Bruin", value: "brown", hex: "#e9e5e3" },
  { label: "Rood", value: "red", hex: "#fbe4e4" },
  { label: "Oranje", value: "orange", hex: "#f6e9d9" },
  { label: "Geel", value: "yellow", hex: "#fbf3db" },
  { label: "Groen", value: "green", hex: "#ddedea" },
  { label: "Blauw", value: "blue", hex: "#ddebf1" },
  { label: "Paars", value: "purple", hex: "#eae4f2" },
  { label: "Roze", value: "pink", hex: "#f4dfeb" },
];

const STYLES = [
  { key: "bold", label: "Vet", glyph: "B", css: { fontWeight: 800 } },
  { key: "italic", label: "Cursief", glyph: "I", css: { fontStyle: "italic" } },
  {
    key: "underline",
    label: "Onderstreept",
    glyph: "U",
    css: { textDecoration: "underline" },
  },
];

const isActiveType = (block, t) =>
  block.type === t.type &&
  (t.props?.level === undefined || block.props?.level === t.props.level);

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: "var(--ff-head)",
        fontSize: 10,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--text-faint)",
        margin: "14px 2px 6px",
      }}
    >
      {children}
    </div>
  );
}

function Chip({ active, onClick, style, label, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        minHeight: 40,
        padding: "8px 12px",
        borderRadius: 10,
        fontFamily: "var(--ff-body)",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        border: active
          ? "1px solid var(--accent-border)"
          : "1px solid var(--border)",
        background: active ? "var(--accent-bg)" : "var(--card2)",
        color: active ? "var(--accent-text)" : "var(--text)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

const Row = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>
);

export default function BlockMenuSheet({ editor, block, onClose }) {
  // Live kopie van het blok: bij open-blijvende acties (type/opmaak/kleur)
  // ververst deze zodat de actieve staat in het menu meebeweegt.
  const [current, setCurrent] = useState(block);

  const run = (fn) => {
    try {
      fn();
    } catch {
      showToast("Actie mislukt");
    }
  };

  // Open-blijvend (Type/Opmaak/Kleur/Tabel): meerdere keuzes achter elkaar.
  const apply = (fn) => {
    run(fn);
    setCurrent((c) => editor.getBlock(c.id) ?? c);
  };

  // Sluitend (Acties): voer uit, focus terug naar de editor, sheet dicht.
  // De sheet sluit ALTIJD — ook als de actie faalt (anders blijft hij hangen).
  const act = (fn) => {
    run(fn);
    editor.focus();
    onClose();
  };

  const isTable = current.type === "table";

  return (
    <Sheet title="Blok" onClose={onClose} backdrop="light">
      <SectionLabel>Type</SectionLabel>
      <Row>
        {TYPES.map((t) => (
          <Chip
            key={t.label}
            label={t.label}
            active={isActiveType(current, t)}
            onClick={() => apply(() => setBlockType(editor, t.type, t.props))}
          >
            {t.label}
          </Chip>
        ))}
      </Row>

      <SectionLabel>Opmaak</SectionLabel>
      <Row>
        {STYLES.map((s) => (
          <Chip
            key={s.key}
            label={s.label}
            style={{ minWidth: 48, ...s.css }}
            onClick={() => apply(() => toggleStyle(editor, s.key))}
          >
            {s.glyph}
          </Chip>
        ))}
      </Row>

      <SectionLabel>Kleur</SectionLabel>
      <Row>
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={c.label}
            onClick={() => apply(() => setBlockColor(editor, current, c.value))}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              cursor: "pointer",
              border: "1px solid var(--border-mid)",
              background: c.hex ?? "var(--card2)",
              // De pastels zijn altijd licht, dus de letter is vast donker
              // (thema-onafhankelijk, hoort bij de data-kleur zelf).
              color: c.hex ? "#403f3d" : "var(--text)",
              fontFamily: "var(--ff-head)",
              fontSize: 15,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {c.hex ? "A" : "✕"}
          </button>
        ))}
      </Row>

      <SectionLabel>Acties</SectionLabel>
      <Row>
        <Chip label="Omhoog" onClick={() => act(() => moveUp(editor, current))}>
          ↑ Omhoog
        </Chip>
        <Chip
          label="Omlaag"
          onClick={() => act(() => moveDown(editor, current))}
        >
          ↓ Omlaag
        </Chip>
        <Chip
          label="Dupliceren"
          onClick={() => act(() => duplicateBlock(editor, current))}
        >
          Dupliceren
        </Chip>
        <Chip
          label="Kopiëren"
          onClick={() =>
            act(() => {
              copyBlock(editor, current);
              showToast("✓ Blok gekopieerd");
            })
          }
        >
          Kopiëren
        </Chip>
        <Chip
          label="Verwijderen"
          style={{
            border: "1px solid var(--danger-border)",
            background: "var(--danger-bg)",
            color: "var(--danger-text)",
          }}
          onClick={() => act(() => removeBlock(editor, current))}
        >
          <Emoji char="🗑️" size={14} /> Verwijderen
        </Chip>
      </Row>

      {isTable && (
        <>
          <SectionLabel>Tabel</SectionLabel>
          <Row>
            {TABLE_ACTIONS.map((a) => (
              <Chip
                key={a.cmd}
                label={a.label}
                onClick={() => apply(() => runTableCommand(editor, a.cmd))}
              >
                {a.glyph}
              </Chip>
            ))}
            <Chip
              label="Tabel wissen"
              style={{ color: "var(--danger-text)" }}
              onClick={() => act(() => deleteTable(editor))}
            >
              <Emoji char="🗑️" size={14} />
            </Chip>
          </Row>
        </>
      )}
    </Sheet>
  );
}
