import { DAYS_NL, MONTHS_NL } from "../../lib/constants.js";
import { Select } from "../../ui/Field.jsx";
import TagField from "./TagField.jsx";

// Korte datum voor de meta-regel, bv. "di 27 okt".
function fmtShortDay(str) {
  const d = new Date(str + "T12:00");
  return `${DAYS_NL[d.getDay()].slice(0, 2).toLowerCase()} ${d.getDate()} ${MONTHS_NL[d.getMonth()].slice(0, 3).toLowerCase()}`;
}

// Meta-rij boven de titel: notitieboek · datum · tags · opslaan-status.
export default function EntryMeta({
  nb,
  notebooks,
  currentNb,
  onMove,
  date,
  tags,
  knownTags,
  onTags,
  saveState,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-2)",
        flexWrap: "wrap",
        // Zelfde linkerkant als de tekst in de editor (44px goot).
        padding: "0 4px 0 44px",
        marginBottom: "var(--sp-2)",
        fontSize: "var(--fs-sm)",
        color: "var(--text-muted)",
      }}
    >
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minHeight: 32,
          padding: "0 10px",
          borderRadius: "var(--r-pill)",
          background: "var(--accent-bg)",
          color: "var(--accent-text)",
          fontWeight: 600,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: nb?.color ?? "var(--accent)",
          }}
        />
        <Select
          value={currentNb}
          onChange={(e) => onMove(e.target.value)}
          aria-label="Notitieboek"
          style={{
            width: "auto",
            border: "none",
            background: "transparent",
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "inherit",
            padding: 0,
            minHeight: 0,
          }}
        >
          {notebooks.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </Select>
      </label>
      <span style={{ whiteSpace: "nowrap" }}>{fmtShortDay(date)}</span>
      <TagField tags={tags} known={knownTags} onChange={onTags} />
      <span style={{ fontSize: "var(--fs-xs)" }}>
        {saveState === "saving" && "Opslaan…"}
        {saveState === "saved" && "Opgeslagen"}
      </span>
    </div>
  );
}
