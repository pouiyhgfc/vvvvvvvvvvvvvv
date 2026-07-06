import { useEffect, useRef } from "react";

// Gedeelde bottom-sheet modal (de weekplanner-popup, veralgemeniseerd).
// Sluit op backdrop-klik en Escape; vergrendelt de achtergrond-scroll.
// `backdrop="light"`: nauwelijks gedimde achtergrond, voor sheets waarbij je
// de inhoud erachter wilt blijven zien (zoals het blok-menu in de editor).
export default function Sheet({
  title,
  subtitle,
  onClose,
  children,
  footer,
  backdrop = "dark",
}) {
  // Negeer een "spook"-klik (touch genereert ~300ms later nog een klik die
  // anders op de backdrop landt en de net-geopende sheet meteen sluit).
  const openedAt = useRef(null);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          backdrop === "light" ? "rgba(0,0,0,.08)" : "rgba(0,0,0,.55)",
        zIndex: 200,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (
          e.target === e.currentTarget &&
          openedAt.current &&
          Date.now() - openedAt.current > 400
        )
          onClose();
      }}
    >
      <div
        style={{
          // Bij een lichte backdrop is het paneel zelf ook semi-transparant
          // (zonder blur), zodat de inhoud erachter zichtbaar blijft.
          background:
            backdrop === "light"
              ? "color-mix(in srgb, var(--card) 30%, transparent)"
              : "var(--card)",
          borderRadius: "16px 16px 0 0",
          padding: 20,
          width: "100%",
          maxWidth: 540,
          maxHeight: "92vh",
          overflowY: "auto",
          animation: "fadeUp .25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: subtitle ? 4 : 12,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--ff-head)",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            style={{
              fontSize: 20,
              color: "var(--text-faint)",
              background: "none",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 11,
              color: "var(--text-faint)",
              marginBottom: 12,
            }}
          >
            {subtitle}
          </div>
        )}
        {children}
        {footer && (
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>{footer}</div>
        )}
      </div>
    </div>
  );
}
