import { useState } from "react";
import { MOODS } from "../../lib/constants.js";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput, TextArea } from "../../ui/Field.jsx";

const parseTags = (str) =>
  str
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

// Toevoegen, bewerken én verwijderen van een logboek-entry.
// Dagnotities (_type "day") bewerken alleen hun tekst.
export default function LogEntrySheet({ entry, onSave, onDelete, onClose }) {
  const isDay = entry?._type === "day";
  const [body, setBody] = useState(entry?.body || "");
  const [tags, setTags] = useState(entry?.tags?.join(", ") || "");
  const [mood, setMood] = useState(entry?.mood || "");
  const [confirmDel, setConfirmDel] = useState(false);

  const save = () => {
    if (!body.trim()) return;
    onSave({ body: body.trim(), tags: parseTags(tags), mood: mood || null });
  };

  return (
    <>
      <Sheet
        title={
          entry
            ? isDay
              ? "Dagnotitie bewerken"
              : "Entry bewerken"
            : "Nieuwe entry"
        }
        onClose={onClose}
        footer={
          <>
            {entry && onDelete && (
              <Button variant="danger" onClick={() => setConfirmDel(true)}>
                <Emoji char="🗑️" size={16} />
              </Button>
            )}
            <Button onClick={save} disabled={!body.trim()} style={{ flex: 1 }}>
              {entry ? (
                <>
                  <Emoji char="💾" size={14} /> Opslaan
                </>
              ) : (
                <>
                  <Emoji char="✅" size={14} /> Toevoegen
                </>
              )}
            </Button>
          </>
        }
      >
        <Field label="Tekst">
          <TextArea
            value={body}
            autoFocus
            rows={5}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Schrijf iets..."
            style={{ minHeight: 110, lineHeight: 1.6 }}
          />
        </Field>
        {!isDay && (
          <>
            <Field label="Tags (komma-gescheiden)">
              <TextInput
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="werk, focus, gezondheid"
              />
            </Field>
            <Field label="Stemming (optioneel)">
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMood(mood === m.value ? "" : m.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px",
                      borderRadius: 8,
                      border:
                        mood === m.value
                          ? "2px solid var(--accent)"
                          : "1.5px solid var(--border)",
                      background:
                        mood === m.value ? "var(--sel-bg)" : "var(--card)",
                      fontSize: 11,
                      fontWeight: 600,
                      color:
                        mood === m.value
                          ? "var(--accent)"
                          : "var(--text-muted)",
                    }}
                  >
                    <Emoji char={m.emoji} size={16} />
                    {m.value}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}
      </Sheet>

      {confirmDel && (
        <ConfirmDialog
          title={isDay ? "Dagnotitie wissen?" : "Entry verwijderen?"}
          message={
            isDay
              ? "De notitie bij deze dag wordt gewist."
              : "Deze logboek-entry wordt verwijderd."
          }
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
