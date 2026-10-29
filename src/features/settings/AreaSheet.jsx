import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";
import { EVENT_COLORS } from "../../lib/constants.js";
import EditFooter from "../../ui/EditFooter.jsx";

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
          <EditFooter
            isEdit={!!area}
            canSave={!!name.trim()}
            onSave={save}
            onDelete={onDelete && (() => setConfirmDel(true))}
          />
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
