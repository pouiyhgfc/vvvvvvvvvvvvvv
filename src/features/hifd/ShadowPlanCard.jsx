import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db.js";
import { addDays } from "../../lib/date.js";
import { manzilPlan } from "../../lib/manzil.js";
import { surahById } from "../../lib/surahs.js";
import Card from "../../ui/Card.jsx";
import { today } from "./hifdDates.js";

// Schaduwmodus (optie B, zie .md/HIFD-ONDERZOEK.md): wat sabqi + manzil
// vandaag zou plannen, naast het huidige schema. Alleen ter vergelijking;
// beoordelen gebeurt nog in de kaart hierboven.
export default function ShadowPlanCard({ records, budget }) {
  const t = today();
  const logs = useLiveQuery(
    () => db.hifdLogV2.where("date").above(addDays(t, -8)).toArray(),
    [t],
  );
  if (!records || !logs) return null;
  const plan = manzilPlan(records, logs, t, budget);
  if (plan.sabqiCount + plan.manzilCount === 0) return null;

  const names = (list, total) =>
    list.length
      ? list.map((r) => surahById(r.surah)?.tr).join(", ")
      : total
        ? "klaar voor vandaag"
        : "niets";

  return (
    <Card style={{ gap: 6 }}>
      <p
        style={{
          margin: 0,
          fontSize: "var(--fs-xs)",
          color: "var(--text-muted)",
        }}
      >
        Proef: sabqi + manzil (ter vergelijking)
      </p>
      <p style={line}>
        <b>Sabqi</b> · {names(plan.sabqiToday, plan.sabqiCount)}
      </p>
      <p style={line}>
        <b>Manzil</b> · {names(plan.manzilToday, plan.manzilCount)}
      </p>
      {plan.manzilCount > 0 && (
        <p
          style={{
            margin: 0,
            fontSize: "var(--fs-sm)",
            color: "var(--text-muted)",
          }}
        >
          Je manzil ({plan.manzilCount} surahs) komt elke {plan.cycleDays}{" "}
          {plan.cycleDays === 1 ? "dag" : "dagen"} helemaal langs.
        </p>
      )}
    </Card>
  );
}

const line = { margin: 0, fontSize: "var(--fs-sm)", color: "var(--text)" };
