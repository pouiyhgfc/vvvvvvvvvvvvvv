import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";

// Bewerken van een weekschema-template: hernoemen, inladen, vervangen, verwijderen.
export default function WeekTemplateSheet({
  tpl,
  onRename,
  onLoad,
  onReplace,
  onDelete,
  onClose,
}) {
  const [name, setName] = useState(tpl.name);
  const [confirm, setConfirm] = useState(null); // "replace" | "delete" | null

  return (
    <>
      <Sheet
        title="Weekschema"
        subtitle={`${tpl.events.length} events`}
        onClose={onClose}
        footer={
          <>
            <Button variant="danger" onClick={() => setConfirm("delete")}>
              <Emoji char="🗑️" size={16} />
            </Button>
            <Button
              onClick={() => name.trim() && onRename(name.trim())}
              disabled={!name.trim() || name.trim() === tpl.name}
              style={{ flex: 1 }}
            >
              <Emoji char="💾" size={14} /> Naam opslaan
            </Button>
          </>
        }
      >
        <Field label="Naam">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam weekschema..."
          />
        </Field>
        <Field label="Inladen in de huidige week">
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" style={{ flex: 1 }} onClick={onLoad}>
              <Emoji char="➕" size={14} /> Toevoegen
            </Button>
            <Button
              variant="secondary"
              style={{ flex: 1 }}
              onClick={() => setConfirm("replace")}
            >
              <Emoji char="🔄" size={14} /> Vervangen
            </Button>
          </div>
        </Field>
      </Sheet>

      {confirm === "replace" && (
        <ConfirmDialog
          title="Week vervangen?"
          message={`"${tpl.name}" inladen en de losse events van de huidige week vervangen?`}
          confirmLabel="Vervangen"
          danger={false}
          onCancel={() => setConfirm(null)}
          onConfirm={onReplace}
        />
      )}
      {confirm === "delete" && (
        <ConfirmDialog
          title="Weekschema verwijderen?"
          message={`"${tpl.name}" wordt verwijderd.`}
          onCancel={() => setConfirm(null)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
