import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import { Field, TextInput, Select } from "../../ui/Field.jsx";
import EditFooter from "../../ui/EditFooter.jsx";
import IconNameField from "../../ui/IconNameField.jsx";

// Toevoegen, bewerken én verwijderen van een routine. `routine` null = nieuw.
export default function RoutineSheet({
  routine,
  periodLabel,
  areaNames,
  onSave,
  onDelete,
  onClose,
}) {
  const [name, setName] = useState(routine?.name || "");
  const [icon, setIcon] = useState(routine?.icon || "✅");
  const [area, setArea] = useState(routine?.area || areaNames[0] || "");
  const [desc, setDesc] = useState(routine?.desc || "");
  const [confirmDel, setConfirmDel] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    onSave({
      ...(routine ? { id: routine.id } : {}),
      name: name.trim(),
      icon,
      area,
      desc: desc.trim(),
    });
  };

  return (
    <>
      <Sheet
        title={routine ? "Routine bewerken" : "Nieuwe routine"}
        subtitle={periodLabel}
        onClose={onClose}
        footer={
          <EditFooter
            isEdit={!!routine}
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
          placeholder="Routine naam..."
          onEnter={save}
        />
        <Field label="Focusgebied">
          <Select value={area} onChange={(e) => setArea(e.target.value)}>
            {areaNames.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Beschrijving (optioneel)">
          <TextInput
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Korte beschrijving..."
          />
        </Field>
      </Sheet>

      {confirmDel && (
        <ConfirmDialog
          title="Routine verwijderen?"
          message={`"${routine.name}" wordt verwijderd. Je dagdata blijft bewaard.`}
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
