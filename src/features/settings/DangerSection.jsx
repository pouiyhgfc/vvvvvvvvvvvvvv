import { useState } from "react";
import { DEFAULT_ROUTINES } from "../../lib/constants.js";
import { showToast } from "../../lib/toast.js";
import ConfirmDialog from "../../ui/ConfirmDialog.jsx";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";
import { introP } from "./settingsStyles.js";

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
      <Section
        title="Gevarenzone"
        icon={<Emoji char="⚠️" size={20} />}
        tone="danger"
      >
        <p style={introP}>
          Exporteer eerst een backup. Wissen kan niet ongedaan worden gemaakt.
        </p>
        <div style={{ display: "grid", gap: "var(--sp-2)" }}>
          <Button variant="danger" full onClick={() => setConfirmReset(true)}>
            Routines terugzetten naar standaard
          </Button>
          <Button variant="danger" full onClick={() => setConfirmClear("days")}>
            Wis alle dagdata
          </Button>
          <Button
            variant="dangerSolid"
            full
            onClick={() => setConfirmClear("all")}
          >
            Wis alles
          </Button>
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
