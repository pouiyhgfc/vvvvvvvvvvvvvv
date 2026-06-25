import { useState } from "react";
import { EVENT_COLORS } from "../../lib/constants.js";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import IconField from "../../ui/IconField.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";

// Toevoegen, bewerken én verwijderen van een notitieboek. `notebook` null = nieuw.
export default function NotebookSheet({ notebook, onSave, onDelete, onClose }) {
  const [name, setName] = useState(notebook?.name || "");
  const [icon, setIcon] = useState(notebook?.icon || "📓");
  const [color, setColor] = useState(notebook?.color || EVENT_COLORS[0]);
  const [confirmDel, setConfirmDel] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), icon, color });
  };

  return (
    <>
      <Sheet
        title={notebook ? "Notitieboek bewerken" : "Nieuw notitieboek"}
        onClose={onClose}
        footer={
          <>
            {notebook && onDelete && (
              <Button variant="danger" onClick={() => setConfirmDel(true)}>
                <Emoji char="🗑️" size={16} />
              </Button>
            )}
            <Button onClick={save} disabled={!name.trim()} style={{ flex: 1 }}>
              {notebook ? "💾 Opslaan" : "✓ Toevoegen"}
            </Button>
          </>
        }
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <IconField value={icon} onChange={setIcon} />
          <TextInput
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam notitieboek..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            style={{ flex: 1, minWidth: 140 }}
          />
        </div>
        <Field label="Kleur">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </Sheet>

      {confirmDel && (
        <ConfirmDialog
          title="Notitieboek verwijderen?"
          message={`"${notebook.name}" wordt verwijderd. De entries erin verhuizen naar het Logboek (gaan niet verloren).`}
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
