import { useState } from "react";
import { applyWeekTemplate } from "../../lib/date.js";
import Button from "../../ui/Button.jsx";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Sheet from "../../ui/Sheet.jsx";

// Een opgeslagen weekschema in deze week zetten: erbij voegen, of de losse
// blokken van deze week vervangen (herhalende blokken blijven staan).
// Opslaan en beheren van schema's zit onder Meer → Weekschema's.
export default function WeekScheduleSheet({
  templates,
  monday,
  onApply,
  onClose,
}) {
  const [replaceTpl, setReplaceTpl] = useState(null);
  return (
    <>
      <Sheet title="Weekschema laden" onClose={onClose}>
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minHeight: 56,
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "var(--fs-md)" }}>
                {tpl.name}
              </span>
              <span
                style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }}
              >
                {tpl.events.length} blokken
              </span>
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onApply(applyWeekTemplate(tpl, monday), false)}
            >
              Erbij
            </Button>
            <Button size="sm" onClick={() => setReplaceTpl(tpl)}>
              Vervangen
            </Button>
          </div>
        ))}
      </Sheet>
      {replaceTpl && (
        <ConfirmDialog
          title="Deze week vervangen?"
          message={`De losse blokken van deze week maken plaats voor "${replaceTpl.name}". Herhalende blokken blijven staan.`}
          confirmLabel="Vervangen"
          danger={false}
          onConfirm={() => onApply(applyWeekTemplate(replaceTpl, monday), true)}
          onCancel={() => setReplaceTpl(null)}
        />
      )}
    </>
  );
}
