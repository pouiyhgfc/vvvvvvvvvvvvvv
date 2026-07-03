import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";
import { EVENT_COLORS } from "../../lib/constants.js";

// Toevoegen, bewerken én verwijderen van een focusgebied. `area` null = nieuw.
export default function AreaSheet({ area, onSave, onDelete, onClose }) {
  const [name, setName] = useState(area?.name || "");
  const [color, setColor] = useState(area?.color || EVENT_COLORS[0]);
  const [confirmDel, setConfirmDel] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  return (
    <>
      <Sheet
        title={area ? "Focusgebied bewerken" : "Nieuw focusgebied"}
        onClose={onClose}
        footer={
          <>
            {area && onDelete && (
              <Button variant="danger" onClick={() => setConfirmDel(true)}>
                <Emoji char="🗑️" size={16} />
              </Button>
            )}
            <Button onClick={save} disabled={!name.trim()} style={{ flex: 1 }}>
              {area ? (
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
        <Field label="Naam">
          <TextInput
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            placeholder="Naam focusgebied..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
          />
        </Field>
        <Field label="Kleur" hint="Gebruikt voor routines in dit gebied.">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </Sheet>

      {confirmDel && (
        <ConfirmDialog
          title="Focusgebied verwijderen?"
          message={`"${area.name}" wordt verwijderd. Routines in dit gebied houden de naam maar krijgen een neutrale kleur.`}
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
