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

// BlockNote's eigen highlight-namen; de dot-kleur komt uit BlockNote's tokens
// zodat de stip exact de gerenderde achtergrond toont.
const COLORS = [
  { label: "Geen", value: "default" },
  { label: "Grijs", value: "gray" },
  { label: "Bruin", value: "brown" },
  { label: "Rood", value: "red" },
  { label: "Oranje", value: "orange" },
  { label: "Geel", value: "yellow" },
  { label: "Groen", value: "green" },
  { label: "Blauw", value: "blue" },
  { label: "Paars", value: "purple" },
  { label: "Roze", value: "pink" },
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
  // Voer een actie uit en geef daarna de focus terug aan de editor, zodat de
  // cursor niet wegspringt; sluit de sheet.
  const act = (fn) => {
    fn();
    editor.focus();
    onClose();
  };

  const isTable = block.type === "table";

  return (
    <Sheet title="Blok" onClose={onClose}>
      <SectionLabel>Type</SectionLabel>
      <Row>
        {TYPES.map((t) => (
          <Chip
            key={t.label}
            label={t.label}
            active={isActiveType(block, t)}
            onClick={() => act(() => setBlockType(editor, t.type, t.props))}
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
            onClick={() => act(() => toggleStyle(editor, s.key))}
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
            onClick={() => act(() => setBlockColor(editor, block, c.value))}
            style={{
              width: 34,
              height: 34,
              borderRadius: 99,
              cursor: "pointer",
              border: "1px solid var(--border)",
              background:
                c.value === "default"
                  ? "var(--card2)"
                  : `var(--bn-colors-highlights-${c.value}-background)`,
            }}
          />
        ))}
      </Row>

      <SectionLabel>Acties</SectionLabel>
      <Row>
        <Chip label="Omhoog" onClick={() => act(() => moveUp(editor, block))}>
          ↑ Omhoog
        </Chip>
        <Chip label="Omlaag" onClick={() => act(() => moveDown(editor, block))}>
          ↓ Omlaag
        </Chip>
        <Chip
          label="Dupliceren"
          onClick={() => act(() => duplicateBlock(editor, block))}
        >
          Dupliceren
        </Chip>
        <Chip
          label="Kopiëren"
          onClick={() =>
            act(() => {
              copyBlock(editor, block);
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
          onClick={() => act(() => removeBlock(editor, block))}
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
                onClick={() => act(() => runTableCommand(editor, a.cmd))}
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
