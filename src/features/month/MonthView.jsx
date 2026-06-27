import { MONTHS_NL } from "../../lib/constants.js";
import NavBtn from "../../ui/NavBtn.jsx";

export default function MonthView({
  date,
  setDate,
  setView,
  routines,
  allDays,
}) {
  const y = date.getFullYear(),
    m = date.getMonth();
  const first = new Date(y, m, 1),
    last = new Date(y, m + 1, 0);
  const fDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const total = Object.values(routines).flat().length;

  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    const k = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const data = allDays[k];
    const done = data?.checked
      ? Object.values(data.checked).filter(Boolean).length
      : 0;
    days.push({
      day: d,
      pct: total > 0 ? Math.round((done / total) * 100) : 0,
      done,
    });
  }

  const color = (pct) =>
    pct === 0
      ? "var(--heat0)"
      : pct < 30
        ? "#fecaca"
        : pct < 60
          ? "#fde68a"
          : pct < 80
            ? "#bbf7d0"
            : "#0e7a52";
  const today = new Date();

  return (
    <div style={{ padding: "14px 12px 24px", animation: "fadeUp .3s ease" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <NavBtn
          onClick={() => {
            const d = new Date(date);
            d.setMonth(d.getMonth() - 1);
            setDate(d);
          }}
        >
          ◀
        </NavBtn>
        <h2
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {MONTHS_NL[m]} {y}
        </h2>
        <NavBtn
          onClick={() => {
            const d = new Date(date);
            d.setMonth(d.getMonth() + 1);
            setDate(d);
          }}
        >
          ▶
        </NavBtn>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 3,
          marginBottom: 5,
        }}
      >
        {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((d) => (
          <div
            key={d}
            style={{
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-faint)",
              padding: 2,
            }}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7,1fr)",
          gap: 3,
        }}
      >
        {Array(fDow)
          .fill(null)
          .map((_, i) => (
            <div key={`e${i}`} />
          ))}
        {days.map((d) => {
          const isT =
            d.day === today.getDate() &&
            m === today.getMonth() &&
            y === today.getFullYear();
          return (
            <div
              key={d.day}
              onClick={() => {
                setDate(new Date(y, m, d.day));
                setView("tracker");
              }}
              style={{
                textAlign: "center",
                padding: "6px 2px",
                borderRadius: 7,
                background: color(d.pct),
                cursor: "pointer",
                border: isT
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
                transition: "all .15s",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: isT ? 800 : 500,
                  color: d.pct >= 80 ? "white" : "var(--text)",
                }}
              >
                {d.day}
              </div>
              {d.done > 0 && (
                <div
                  style={{
                    fontSize: 8,
                    color: d.pct >= 80 ? "rgba(255,255,255,.85)" : "#6b7280",
                  }}
                >
                  {d.pct}%
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          ["var(--heat0)", "0%"],
          ["#fecaca", "<30%"],
          ["#fde68a", "<60%"],
          ["#bbf7d0", "<80%"],
          ["#0e7a52", "80%+"],
        ].map(([c, l]) => (
          <div
            key={l}
            style={{ display: "flex", alignItems: "center", gap: 3 }}
          >
            <div
              style={{ width: 9, height: 9, borderRadius: 2, background: c }}
            />
            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
