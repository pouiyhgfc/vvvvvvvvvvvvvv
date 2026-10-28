import { useState } from "react";
import { DEFAULT_ROUTINES } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";

// Gevarenzone: routines resetten en data wissen, altijd via een bevestiging.
export default function DangerSection({
  setRoutines,
  clearAllDays,
  clearEverything,
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(null); // "days" | "all"

  return (
    <>
      {/* DANGER ZONE */}
      <Section
        title="Gevarenzone"
        icon={<Emoji char="⚠️" size={20} />}
        tone="danger"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button
            onClick={() => setConfirmReset(true)}
            style={{
              padding: "8px",
              borderRadius: 7,
              background: "var(--card)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
              fontSize: 11,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            Reset routines naar standaard{" "}
            <span style={{ opacity: 0.7, fontWeight: 400 }}>
              (dagdata blijft)
            </span>
          </button>
          <button
            onClick={() => setConfirmClear("days")}
            style={{
              padding: "8px",
              borderRadius: 7,
              background: "var(--card)",
              border: "1px solid var(--danger-border)",
              color: "var(--danger-text)",
              fontSize: 11,
              fontWeight: 600,
              textAlign: "left",
            }}
          >
            Wis alle dagdata{" "}
            <span style={{ opacity: 0.7, fontWeight: 400 }}>
              (routines blijven)
            </span>
          </button>
          <button
            onClick={() => setConfirmClear("all")}
            style={{
              padding: "8px",
              borderRadius: 7,
              background: "#dc2626",
              border: "1px solid #dc2626",
              color: "white",
              fontSize: 11,
              fontWeight: 700,
              textAlign: "left",
            }}
          >
            Wis ALLES (reset naar fabrieksinstellingen)
          </button>
        </div>
      </Section>
      {confirmReset && (
        <ConfirmDialog
          title="Routines resetten?"
          message="Alle routines terugzetten naar standaard? Je dagdata blijft bewaard."
          confirmLabel="Resetten"
          danger={false}
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            setRoutines(DEFAULT_ROUTINES);
            setConfirmReset(false);
            showToast("✓ Routines gereset");
          }}
        />
      )}
      {confirmClear === "days" && (
        <ConfirmDialog
          title="Alle dagdata wissen?"
          message="Al je afgevinkte dagen, energie, mood en notities worden gewist (routines blijven). Exporteer eerst een backup — dit kan niet ongedaan worden gemaakt."
          confirmLabel="Wis dagdata"
          onCancel={() => setConfirmClear(null)}
          onConfirm={() => {
            setConfirmClear(null);
            clearAllDays();
          }}
        />
      )}
      {confirmClear === "all" && (
        <ConfirmDialog
          title="ALLES wissen?"
          message="Dit zet de hele app terug naar fabrieksinstellingen: routines, gebieden, templates, weekplanning én alle dagdata. Exporteer eerst een backup — dit is definitief."
          confirmLabel="Wis alles"
          onCancel={() => setConfirmClear(null)}
          onConfirm={() => {
            setConfirmClear(null);
            clearEverything();
          }}
        />
      )}
    </>
  );
}
