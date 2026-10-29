import { useState } from "react";
import { db } from "../../lib/db.js";
import { buildStart } from "../../lib/starterPacks.js";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";

const CHOICES = [
  {
    key: "basis",
    icon: "💧",
    title: "Basisroutines",
    desc: "Water, bewegen, lezen, plannen en op tijd slapen.",
  },
  {
    key: "geloof",
    icon: "🕌",
    title: "Gebed en Quran",
    desc: "De vijf gebeden, adhkar en Quran lezen.",
  },
  {
    key: "hifd",
    icon: "📖",
    title: "Hifd",
    desc: "Koran memoriseren en herhalen, met een eigen tabblad.",
  },
];

// Eerste start op een nieuw toestel: kies waarmee je begint, of zet een
// backup terug. Alles blijft op dit toestel; kiezen kan later nog anders.
export default function Welcome({ onImport }) {
  const [choice, setChoice] = useState({ basis: true });
  const toggle = (key) => setChoice((c) => ({ ...c, [key]: !c[key] }));

  return (
    <main
      aria-labelledby="welkom-titel"
      style={{
        maxWidth: 540,
        margin: "0 auto",
        minHeight: "100vh",
        padding:
          "calc(env(safe-area-inset-top) + var(--sp-6)) var(--sp-4) var(--sp-6)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-4)",
        background: "var(--bg)",
      }}
    >
      <img
        src="/icon-192.png"
        alt=""
        width={64}
        height={64}
        style={{ borderRadius: 14 }}
      />
      <div>
        <h1
          id="welkom-titel"
          style={{
            margin: "0 0 var(--sp-2)",
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 600,
          }}
        >
          Welkom
        </h1>
        <p style={text}>
          Vink je routines af, plan je week en houd notities bij. Alles blijft
          op dit toestel; er is geen account.
        </p>
      </div>

      <section>
        <h2 style={label}>Waar wil je mee beginnen?</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CHOICES.map((c) => (
            <button
              key={c.key}
              type="button"
              aria-pressed={!!choice[c.key]}
              onClick={() => toggle(c.key)}
              style={option(!!choice[c.key])}
            >
              <Emoji char={c.icon} size={24} />
              <span style={{ flex: 1, textAlign: "start" }}>
                <span style={{ display: "block", fontWeight: 600 }}>
                  {c.title}
                </span>
                <span style={{ ...text, display: "block" }}>{c.desc}</span>
              </span>
            </button>
          ))}
        </div>
        <p style={{ ...text, marginTop: "var(--sp-2)" }}>
          Niets gekozen? Dan begin je leeg. Routines en focusgebieden pas je
          later aan in Meer.
        </p>
      </section>

      <Button full onClick={() => applyStart(choice)}>
        Beginnen
      </Button>
      <label style={{ ...text, textAlign: "center", cursor: "pointer" }}>
        Al een backup? <u>Zet hem terug</u>
        <input
          type="file"
          accept="application/json,.json"
          aria-label="Backup terugzetten"
          onChange={(e) => {
            if (e.target.files?.[0]) onImport(e.target.files[0]);
            e.target.value = "";
          }}
          style={{ display: "none" }}
        />
      </label>
    </main>
  );
}

// Schrijft de keuze weg en markeert de app als ingericht.
async function applyStart(choice) {
  const { routines, areas } = buildStart(choice);
  await db.transaction("rw", db.blobs, db.settings, db.meta, async () => {
    await db.blobs.put({ key: "routines", data: routines });
    if (areas.length) await db.blobs.put({ key: "areas", data: areas });
    const settings = await db.settings.get("singleton");
    await db.settings.put({
      ...settings,
      id: "singleton",
      hifdEnabled: !!choice.hifd,
      dailyTemplate: "kort",
    });
    await db.meta.put({ key: "onboarded", value: true });
  });
}

const text = {
  margin: 0,
  fontSize: "var(--fs-sm)",
  color: "var(--text-muted)",
  lineHeight: 1.5,
};
const label = {
  margin: "0 0 var(--sp-2)",
  fontSize: "var(--fs-md)",
  fontWeight: 600,
};
const option = (on) => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
  minHeight: 64,
  padding: "10px 14px",
  borderRadius: "var(--r-md)",
  border: `1px solid ${on ? "var(--accent-border)" : "var(--border-soft)"}`,
  background: on ? "var(--accent-bg)" : "var(--card)",
  color: "var(--text)",
  fontSize: "var(--fs-md)",
});
