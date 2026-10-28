import { useState } from "react";
import Sheet from "../../ui/Sheet.jsx";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Icon from "../../ui/Icon.jsx";
import { Field, TextArea } from "../../ui/Field.jsx";

// Dagnotitie uit de tracker (`days.notes`) bewerken of wissen. Dat is platte
// tekst; notities in een notitieboek openen de pagina met de rijke editor.
export default function LogEntrySheet({ entry, onSave, onDelete, onClose }) {
  const [body, setBody] = useState(entry?.body || "");
  const [confirmDel, setConfirmDel] = useState(false);

  const save = () => {
    if (!body.trim()) return;
    onSave({ body: body.trim() });
  };

  return (
    <>
      <Sheet
        title="Dagnotitie bewerken"
        onClose={onClose}
        footer={
          <>
            {onDelete && (
              <Button
                variant="danger"
                aria-label="Dagnotitie wissen"
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
            )}
            <Button onClick={save} disabled={!body.trim()} style={{ flex: 1 }}>
              Opslaan
            </Button>
          </>
        }
      >
        <Field label="Tekst">
          <TextArea
            value={body}
            autoFocus
            dir="auto"
            rows={5}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Schrijf iets..."
            style={{ minHeight: 110, lineHeight: 1.6 }}
          />
        </Field>
      </Sheet>

      {confirmDel && (
        <ConfirmDialog
          title="Dagnotitie wissen?"
          message="De notitie bij deze dag wordt gewist."
          onCancel={() => setConfirmDel(false)}
          onConfirm={onDelete}
        />
      )}
    </>
  );
}
