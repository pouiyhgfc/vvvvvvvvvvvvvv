import { useEffect, useState } from "react";
import Button from "../../ui/Button.jsx";
import Emoji from "../../ui/Emoji.jsx";

// Toont of de browser de opslag als "persistent" heeft gemarkeerd. Zonder die
// bescherming mag de browser je data wissen bij ruimtegebrek op het toestel.
export default function StorageStatus() {
  const [persisted, setPersisted] = useState(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted, () => {});
  }, []);

  if (persisted == null) return null;

  const ask = () =>
    navigator.storage.persist().then(setPersisted, () => setPersisted(false));

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "var(--text-muted)",
        marginBottom: 10,
      }}
    >
      <Emoji char={persisted ? "🛡️" : "⚠️"} size={14} />
      <span style={{ flex: 1 }}>
        {persisted
          ? "Opslag beschermd: de browser wist je data niet vanzelf."
          : "Opslag niet beschermd: bij ruimtegebrek mag de browser je data wissen. Installeer de app op je beginscherm en vraag het opnieuw."}
      </span>
      {!persisted && (
        <Button size="sm" variant="secondary" onClick={ask}>
          Opnieuw vragen
        </Button>
      )}
    </div>
  );
}
