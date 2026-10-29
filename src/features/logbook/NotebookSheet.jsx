import { useState } from "react";
import { EVENT_COLORS } from "../../lib/constants.js";
import Sheet from "../../ui/Sheet.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import { Field } from "../../ui/Field.jsx";
import EditFooter from "../../ui/EditFooter.jsx";
import IconNameField from "../../ui/IconNameField.jsx";

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
          <EditFooter
            isEdit={!!notebook}
            canSave={!!name.trim()}
            onSave={save}
            onDelete={onDelete && (() => setConfirmDel(true))}
          />
        }
      >
        <IconNameField
          icon={icon}
          onIcon={setIcon}
          value={name}
          onChange={setName}
          placeholder="Naam notitieboek..."
          onEnter={save}
        />
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
