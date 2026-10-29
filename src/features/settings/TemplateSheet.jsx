import { useState } from "react";
import { EVENT_COLORS } from "../../lib/constants.js";
import Sheet from "../../ui/Sheet.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import ColorPicker from "../../ui/ColorPicker.jsx";
import { Field, TextInput } from "../../ui/Field.jsx";
import EditFooter from "../../ui/EditFooter.jsx";
import IconNameField from "../../ui/IconNameField.jsx";

// Toevoegen, bewerken én verwijderen van een weekplanner-template.
export default function TemplateSheet({ template, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(template?.title || "");
  const [icon, setIcon] = useState(template?.icon || "✅");
  const [color, setColor] = useState(template?.color || EVENT_COLORS[0]);
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
          <EditFooter
            isEdit={!!template}
            canSave={!!title.trim()}
            onSave={save}
            onDelete={onDelete && (() => setConfirmDel(true))}
          />
        }
      >
        <IconNameField
          icon={icon}
          onIcon={setIcon}
          value={title}
          onChange={setTitle}
          placeholder="Template naam..."
          onEnter={save}
        />
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
