import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import IconField from "../../ui/IconField.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";

// Toevoegen, bewerken én verwijderen van een weekplanner-template.
export default function TemplateSheet({ template, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(template?.title || "");
  const [icon, setIcon] = useState(template?.icon || "✅");
  const [color, setColor] = useState(template?.color || "#0e7a52");
  const [desc, setDesc] = useState(template?.desc || "");
  const [confirmDel, setConfirmDel] = useState(false);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      ...(template ? { id: template.id } : {}),
      title: title.trim(),
      icon,
      color,
      desc: desc.trim(),
    });
  };

  return (
    <>
      <Sheet
        title={template ? "Template bewerken" : "Nieuwe template"}
        subtitle="Tijd stel je later op de kalender in"
        onClose={onClose}
        footer={
          <>
            {template && onDelete && (
              <Button variant="danger" onClick={() => setConfirmDel(true)}>
                <Emoji char="🗑️" size={16} />
              </Button>
            )}
            <Button onClick={save} disabled={!title.trim()} style={{ flex: 1 }}>
              {template ? (
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
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template naam..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
            }}
            style={{ flex: 1, minWidth: 140 }}
          />
        </div>
        <Field label="Beschrijving (optioneel)">
          <TextInput
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Korte beschrijving..."
          />
        </Field>
        <Field label="Kleur">
          <ColorPicker value={color} onChange={setColor} />
        </Field>
      </Sheet>

      {confirmDel && (
        <ConfirmDialog
          title="Template verwijderen?"
          message={`"${template.title}" wordt verwijderd.`}
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
