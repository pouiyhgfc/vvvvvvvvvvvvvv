import { useState } from "react";
import ListRow from "../../ui/ListRow.jsx";
import { buzz } from "../../lib/storage.js";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";
import AreaSheet from "./AreaSheet.jsx";
import Icon from "../../ui/Icon.jsx";
import AddButton from "./AddButton.jsx";
import { introP } from "./settingsStyles.js";

// Focusgebieden: naam en kleur; hernoemen past ook de routines aan.
export default function AreasSection({ areas, setAreas, setRoutines }) {
  const [areaSheet, setAreaSheet] = useState(null); // "new" | { area, index }

  const saveArea = (data) => {
    buzz();
    if (areaSheet === "new") {
      setAreas((prev) => [...prev, data]);
    } else {
      const i = areaSheet.index;
      const old = areas[i]?.name;
      setAreas((prev) => prev.map((a, idx) => (idx === i ? data : a)));
      if (old && old !== data.name)
        setRoutines((prev) => {
          const n = {};
          for (const k in prev)
            n[k] = prev[k].map((r) =>
              r.area === old ? { ...r, area: data.name } : r,
            );
          return n;
        });
    }
    setAreaSheet(null);
  };
  const deleteArea = () => {
    const i = areaSheet.index;
    setAreas((prev) => prev.filter((_, idx) => idx !== i));
    setAreaSheet(null);
  };

  return (
    <>
      <Section
        title="Focusgebieden"
        icon={<Emoji char="🎯" size={20} />}
        right={
          <AddButton
            label="Gebied toevoegen"
            onClick={() => setAreaSheet("new")}
          />
        }
      >
        <p style={introP}>
          Tik een gebied aan om naam en kleur te wijzigen. De kleur zie je bij
          de routines in dat gebied.
        </p>
        {areas.map((ar, i) => (
          <ListRow key={i} onClick={() => setAreaSheet({ area: ar, index: i })}>
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                background: ar.color,
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1 }}>{ar.name}</span>
            <Icon
              name="caret-right"
              size={18}
              style={{ color: "var(--text-faint)" }}
            />
          </ListRow>
        ))}
      </Section>
      {areaSheet && (
        <AreaSheet
          area={areaSheet === "new" ? null : areaSheet.area}
          onSave={saveArea}
          onDelete={
            areaSheet !== "new" && areas.length > 1 ? deleteArea : undefined
          }
          onClose={() => setAreaSheet(null)}
        />
      )}
    </>
  );
}
