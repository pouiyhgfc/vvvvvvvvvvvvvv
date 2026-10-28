import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { isActive } from "../../lib/notes.js";
import { renameTag, tagKey, tagStats } from "../../lib/tags.js";
import { showToast } from "../../lib/toast.js";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";
import Icon from "../../ui/Icon.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Alle tags met hoe vaak ze voorkomen. Tik = hernoemen; een naam die al
// bestaat voegt de twee samen. Verwijderen haalt de tag uit alle notities.
export default function TagManager() {
  const stats = useLiveQuery(async () =>
    tagStats((await db.logEntries.toArray()).filter(isActive)),
  );
  const [editing, setEditing] = useState(null);

  if (!stats) return null;
  if (stats.length === 0)
    return (
      <p
        style={{
          margin: 0,
          fontSize: "var(--fs-sm)",
          color: "var(--text-muted)",
        }}
      >
        Nog geen tags. Je voegt ze toe bovenaan een notitie.
      </p>
    );

  return (
    <>
      {stats.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setEditing(t)}
          style={{
            width: "100%",
            minHeight: 48,
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "none",
            borderBottom: "1px solid var(--border-soft)",
            background: "transparent",
            color: "var(--text)",
            fontSize: "var(--fs-md)",
            textAlign: "left",
            padding: 0,
          }}
        >
          <span style={{ flex: 1 }}>#{t.name}</span>
          <span
            style={{ fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}
          >
            {t.count}
          </span>
          <Icon
            name="caret-right"
            size={18}
            style={{ color: "var(--text-muted)" }}
          />
        </button>
      ))}
      {editing && (
        <TagSheet
          tag={editing}
          stats={stats}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function TagSheet({ tag, stats, onClose }) {
  const [name, setName] = useState(tag.name);
  const [confirmDel, setConfirmDel] = useState(false);
  const target = stats.find((s) => s.key === tagKey(name) && s.key !== tag.key);
  const changed = name.trim() && name.trim() !== tag.name;

  const save = async () => {
    // Samenvoegen houdt de schrijfwijze van de bestaande tag.
    const n = await renameTag(tag.key, target ? target.name : name);
    showToast(
      target
        ? `Samengevoegd met #${target.name} (${n} notities)`
        : `Hernoemd in ${n} notities`,
    );
    onClose();
  };
  const remove = async () => {
    const n = await renameTag(tag.key, "");
    showToast(`Tag weggehaald uit ${n} notities`);
    onClose();
  };

  return (
    <>
      <Sheet
        title={`#${tag.name}`}
        subtitle={`${tag.count} ${tag.count === 1 ? "notitie" : "notities"}`}
        onClose={onClose}
        footer={
          <>
            <Button
              variant="danger"
              aria-label="Tag verwijderen"
              onClick={() => setConfirmDel(true)}
              style={{
                width: 52,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="trash" size={20} />
            </Button>
            <Button onClick={save} disabled={!changed} style={{ flex: 1 }}>
              {target ? "Samenvoegen" : "Hernoemen"}
            </Button>
          </>
        }
      >
        <Field
          label="Naam"
          hint={
            target
              ? `#${target.name} bestaat al (${target.count}). De twee worden één tag.`
              : "Geldt voor al je notities met deze tag."
          }
        >
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Nieuwe naam"
            style={{ fontSize: "var(--fs-md)", minHeight: 44 }}
          />
        </Field>
      </Sheet>
      {confirmDel && (
        <ConfirmDialog
          title="Tag verwijderen?"
          message={`#${tag.name} wordt uit ${tag.count} ${tag.count === 1 ? "notitie" : "notities"} gehaald. De notities zelf blijven staan.`}
          confirmLabel="Verwijderen"
          onConfirm={remove}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  );
}
