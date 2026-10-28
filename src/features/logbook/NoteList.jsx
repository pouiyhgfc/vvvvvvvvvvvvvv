import Icon from "../../ui/Icon.jsx";
import { groupLabel } from "./noteHelpers.js";

const sectionLabel = {
  fontSize: "var(--fs-xs)",
  fontWeight: 600,
  color: "var(--text-muted)",
  margin: "4px 4px 8px",
};

// De kaarten: vastgezet als eigen sleep-sectie bovenaan, daarna de rest — in
// de eigen volgorde of op datum met groepskoppen. `renderCard(entry, idx,
// handleDown)` maakt één kaart; idx -1 = niet versleepbaar.
export default function NoteList({
  pinned,
  rest,
  sortMode,
  filtering,
  pinnedRef,
  restRef,
  onPinnedHandleDown,
  onRestHandleDown,
  renderCard,
}) {
  return (
    <>
      {pinned.length + rest.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--sp-6) var(--sp-4)",
            color: "var(--text-muted)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--sp-2)",
          }}
        >
          <Icon name="tray" size={32} />
          <p style={{ margin: 0, fontSize: "var(--fs-sm)" }}>
            {filtering
              ? "Geen resultaten."
              : "Nog niets hier. Tik op + voor een nieuwe notitie."}
          </p>
        </div>
      )}
      {pinned.length > 0 && (
        <>
          <div style={sectionLabel}>Vastgezet</div>
          <div ref={pinnedRef} style={{ marginBottom: 6 }}>
            {pinned.map((entry, i) => renderCard(entry, i, onPinnedHandleDown))}
          </div>
        </>
      )}
      {sortMode === "datum" ? (
        <div>
          {(() => {
            let lastLabel = null;
            return rest.map((entry) => {
              const label = groupLabel(
                entry._type === "log" && entry.updatedAt
                  ? entry.updatedAt.slice(0, 10)
                  : entry.date,
              );
              const showHeader = label !== lastLabel;
              lastLabel = label;
              return (
                <div key={entry.id}>
                  {showHeader && (
                    <div style={{ ...sectionLabel, marginTop: 14 }}>
                      {label}
                    </div>
                  )}
                  {renderCard(entry, -1, onRestHandleDown)}
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div ref={restRef}>
          {(() => {
            let logIdx = 0;
            return rest.map((entry) => {
              const isLog = entry._type === "log";
              const idx = isLog ? logIdx++ : -1;
              return renderCard(entry, idx, onRestHandleDown);
            });
          })()}
        </div>
      )}
    </>
  );
}
