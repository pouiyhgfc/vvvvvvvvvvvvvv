import { useState } from "react";
import { db } from "../../lib/db.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Icon from "../../ui/Icon.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Keuze bij "Nieuw": leeg document of een sjabloon. `onPick(null)` = leeg.
// Een sjabloon verwijderen kan hier ook (na bevestiging).
export default function TemplatePickerSheet({ templates, onPick, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  const remove = async () => {
    await db.blobs.put({
      key: "entryTemplates",
      data: templates.filter((t) => t.id !== confirmDelete.id),
    });
    setConfirmDelete(null);
  };
  return (
    <>
      <Sheet title="Nieuwe notitie" onClose={onClose}>
        <Row
          icon={<Icon name="file-text" size={22} />}
          label="Leeg document"
          onClick={() => onPick(null)}
        />
        {templates.map((tpl) => (
          <Row
            key={tpl.id}
            icon={<Emoji char={tpl.icon} size={22} />}
            label={tpl.name}
            onClick={() => onPick(tpl)}
            onDelete={() => setConfirmDelete(tpl)}
          />
        ))}
      </Sheet>
      {confirmDelete && (
        <ConfirmDialog
          title="Sjabloon verwijderen?"
          message={`"${confirmDelete.name}" wordt verwijderd.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={remove}
        />
      )}
    </>
  );
}

function Row({ icon, label, onClick, onDelete }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 52,
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: "none",
          background: "transparent",
          color: "var(--text)",
          fontSize: "var(--fs-md)",
          textAlign: "start",
          padding: 0,
        }}
      >
        <span style={{ display: "flex", color: "var(--text-muted)" }}>
          {icon}
        </span>
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Sjabloon ${label} verwijderen`}
          style={{
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            padding: 0,
          }}
        >
          <Icon name="trash" size={20} />
        </button>
      )}
    </div>
  );
}
