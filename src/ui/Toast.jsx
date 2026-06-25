import { useState, useEffect } from "react";
import { registerToast } from "../lib/toast.js";

// Mount één keer in App. Toont korte in-app meldingen i.p.v. native alert("✓ ...").
export default function ToastHost() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    return registerToast((message) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t, { id, message }]);
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
    });
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 24,
        zIndex: 400,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "var(--text)",
            color: "var(--bg)",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(0,0,0,.25)",
            animation: "fadeUp .2s ease",
            maxWidth: "86%",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
