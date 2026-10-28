import { useState } from "react";
import { cleanTags, tagKey } from "../../lib/tags.js";
import Icon from "../../ui/Icon.jsx";

const MAX_SUGGESTIONS = 8;

// Tags van een notitie als chips. Typen toont je bestaande tags om uit te
// kiezen (meest gebruikt eerst); een nieuwe tag maak je alleen als hij nog
// niet bestaat. Enter of komma voegt toe, Backspace in een leeg veld haalt
// de laatste weg. `known` komt uit tagStats().
export default function TagField({ tags, onChange, known }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const have = new Set(tags.map(tagKey));
  const q = tagKey(query);

  const add = (name) => {
    onChange(cleanTags([...tags, name], known));
    setQuery("");
  };
  const remove = (key) => onChange(tags.filter((t) => tagKey(t) !== key));

  const suggestions = known
    .filter((k) => !have.has(k.key) && (!q || k.key.includes(q)))
    .slice(0, MAX_SUGGESTIONS);
  const isNew = q && !have.has(q) && !known.some((k) => k.key === q);
  // Tikken op een suggestie mag het invoerveld niet laten vervagen.
  const keepFocus = (e) => e.preventDefault();

  return (
    <>
      {tags.map((t) => (
        <span
          key={tagKey(t)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            minHeight: 28,
            padding: "0 2px 0 10px",
            borderRadius: "var(--r-pill)",
            background: "var(--accent-bg)",
            color: "var(--accent-text)",
            fontSize: "var(--fs-sm)",
          }}
        >
          #{t}
          <button
            type="button"
            aria-label={`Tag ${t} weghalen`}
            onClick={() => remove(tagKey(t))}
            style={{
              width: 28,
              height: 28,
              border: "none",
              background: "transparent",
              color: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            <Icon name="x" size={14} />
          </button>
        </span>
      ))}
      <input
        value={query}
        onChange={(e) => {
          const v = e.target.value;
          // Komma = tag klaar (ook handig op een telefoontoetsenbord).
          if (v.includes(",")) v.split(",").slice(0, -1).forEach(add);
          setQuery(v.includes(",") ? v.split(",").at(-1) : v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && q) {
            e.preventDefault();
            add(query);
          } else if (e.key === "Backspace" && !query && tags.length) {
            remove(tagKey(tags.at(-1)));
          }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          if (q) add(query);
        }}
        placeholder={tags.length ? "+ tag" : "+ tags"}
        aria-label="Tag toevoegen"
        style={{
          flex: 1,
          minWidth: 80,
          minHeight: 28,
          border: "none",
          outline: "none",
          background: "transparent",
          fontSize: "var(--fs-sm)",
          color: "var(--text)",
          padding: 0,
        }}
      />
      {focused && (suggestions.length > 0 || isNew) && (
        <div
          role="listbox"
          aria-label="Bestaande tags"
          style={{
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            paddingTop: 4,
          }}
        >
          {suggestions.map((k) => (
            <button
              key={k.key}
              type="button"
              role="option"
              aria-selected={false}
              onPointerDown={keepFocus}
              onClick={() => add(k.name)}
              style={suggestion}
            >
              #{k.name}
              <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                {k.count}
              </span>
            </button>
          ))}
          {isNew && (
            <button
              type="button"
              onPointerDown={keepFocus}
              onClick={() => add(query)}
              style={{ ...suggestion, color: "var(--accent-text)" }}
            >
              + nieuw: {query.trim()}
            </button>
          )}
        </div>
      )}
    </>
  );
}

const suggestion = {
  minHeight: 36,
  padding: "0 12px",
  borderRadius: "var(--r-pill)",
  border: "none",
  background: "var(--sunken)",
  color: "var(--text)",
  fontSize: "var(--fs-sm)",
};
