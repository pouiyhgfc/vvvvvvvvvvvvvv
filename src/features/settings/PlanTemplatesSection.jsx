import { useState } from "react";
import { uid } from "../../lib/date.js";
import { buzz } from "../../lib/storage.js";
import { arrMove } from "../../hooks/useSortable.js";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";
import { SortableTemplateList } from "../../ui/SortableList.jsx";
import TemplateSheet from "./TemplateSheet.jsx";
import { addBtn, introP, emptyList } from "./settingsStyles.js";

// Planning-snelkeuzes: vaste activiteiten om snel een blok mee te maken.
export default function PlanTemplatesSection({
  calTemplates,
  setCalTemplates,
}) {
  const [tplSheet, setTplSheet] = useState(null); // "new" | template

  // --- Weekplanner templates ---
  const saveTemplate = (data) => {
    buzz();
    setCalTemplates((prev) =>
      data.id
        ? prev.map((t) => (t.id === data.id ? { ...t, ...data } : t))
        : [...prev, { id: uid(), ...data }],
    );
    setTplSheet(null);
  };
  const deleteTemplate = () => {
    setCalTemplates((prev) => prev.filter((t) => t.id !== tplSheet.id));
    setTplSheet(null);
  };

  return (
    <>
      {/* WEEKPLANNER TEMPLATES */}
      <Section
        title="Planning-snelkeuzes"
        icon={<Emoji char="📅" size={20} />}
        right={
          <button onClick={() => setTplSheet("new")} style={addBtn}>
            + Nieuw
          </button>
        }
      >
        <p style={introP}>
          Snelkeuze-activiteiten voor de weekkalender. Tik een template aan om
          te bewerken; sleep met ⠿ om te ordenen.
        </p>
        {calTemplates.length === 0 && (
          <div style={emptyList}>Nog geen templates.</div>
        )}
        <SortableTemplateList
          items={calTemplates}
          onReorder={(from, to) =>
            setCalTemplates((prev) => arrMove(prev, from, to))
          }
          onEdit={(t) => setTplSheet(t)}
        />
      </Section>
      {tplSheet && (
        <TemplateSheet
          template={tplSheet === "new" ? null : tplSheet}
          onSave={saveTemplate}
          onDelete={tplSheet !== "new" ? deleteTemplate : undefined}
          onClose={() => setTplSheet(null)}
        />
      )}
    </>
  );
}
