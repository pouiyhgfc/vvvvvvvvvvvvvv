import { useState } from "react";
import { buzz } from "../../lib/storage.js";
import Emoji from "../../ui/Emoji.jsx";
import Section from "../../ui/Section.jsx";
import AreaSheet from "./AreaSheet.jsx";
import { addBtn, introP } from "./settingsStyles.js";

// Focusgebieden: naam en kleur; hernoemen past ook de routines aan.
export default function AreasSection({ areas, setAreas, setRoutines }) {
  const [areaSheet, setAreaSheet] = useState(null); // "new" | { area, index }

  // --- Focusgebieden ---
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
      {/* FOCUSGEBIEDEN */}
      <Section
        title="Focusgebieden"
        icon={<Emoji char="🎯" size={20} />}
        right={
          <button onClick={() => setAreaSheet("new")} style={addBtn}>
            + Gebied
          </button>
        }
      >
        <p style={introP}>
          Tik een gebied aan om naam en kleur te wijzigen. De kleur wordt
          gebruikt voor routines in dit gebied (kalender-events hebben een eigen
          kleur).
        </p>
        {areas.map((ar, i) => (
          <div
            key={i}
            onClick={() => setAreaSheet({ area: ar, index: i })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 10px",
              borderRadius: 8,
              background: "var(--card)",
              borderLeft: `4px solid ${ar.color}`,
              marginBottom: 5,
              boxShadow: "0 1px 2px var(--shadow)",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 8,
                background: ar.color,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
              }}
            >
              {ar.name}
            </span>
            <span style={{ fontSize: 16, color: "var(--text-faint)" }}>›</span>
          </div>
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
