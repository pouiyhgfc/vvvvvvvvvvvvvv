import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { uid } from "../../lib/date.js";
import { showToast } from "../../lib/toast.js";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";
import { TextInput } from "../../ui/Field.jsx";
import IconField from "../../ui/IconField.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Bewaart de huidige inhoud van een notitie als sjabloon (blob
// `entryTemplates`). `getDoc` geeft het huidige BlockNote-document.
export default function SaveTemplateSheet({ getDoc, onClose }) {
  const [tplName, setTplName] = useState("");
  const [tplIcon, setTplIcon] = useState("📄");
  const templatesBlob = useLiveQuery(() => db.blobs.get("entryTemplates"));

  const saveAsTemplate = async () => {
    if (!tplName.trim()) return;
    const current = templatesBlob?.data ?? [];
    await db.blobs.put({
      key: "entryTemplates",
      data: [
        ...current,
        {
          id: uid(),
          name: tplName.trim(),
          icon: tplIcon,
          doc: getDoc(),
        },
      ],
    });
    showToast("✓ Sjabloon opgeslagen");
    onClose();
  };

  return (
    <Sheet
      title="Opslaan als sjabloon"
      onClose={onClose}
      footer={
        <Button full disabled={!tplName.trim()} onClick={saveAsTemplate}>
          <Emoji char="💾" size={14} /> Opslaan
        </Button>
      }
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <IconField value={tplIcon} onChange={setTplIcon} />
        <TextInput
          value={tplName}
          autoFocus
          onChange={(e) => setTplName(e.target.value)}
          placeholder="Naam sjabloon..."
          style={{ flex: 1, minWidth: 140 }}
        />
      </div>
    </Sheet>
  );
}
