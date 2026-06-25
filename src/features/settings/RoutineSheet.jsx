import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import IconField from "../../ui/IconField.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput, Select } from "../../ui/Field.jsx";

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
          <>
            {routine && onDelete && (
              <Button variant="danger" onClick={() => setConfirmDel(true)}>
                <Emoji char="🗑️" size={16} />
              </Button>
            )}
            <Button onClick={save} disabled={!name.trim()} style={{ flex: 1 }}>
              {routine ? "💾 Opslaan" : "✓ Toevoegen"}
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
            placeholder="Routine naam..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            style={{ flex: 1, minWidth: 140 }}
          />
        </div>
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
