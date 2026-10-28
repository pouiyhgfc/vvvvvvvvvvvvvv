import { useState } from "react";
import Icon from "../../ui/Icon.jsx";
import ReviewSheet from "../review/ReviewSheet.jsx";

// "Meer"-tab: ingangen naar Statistieken en de weekreview, met daaronder de
// instellingen.
export default function MoreView({
  onOpenStats,
  routines,
  calEvents,
  children,
}) {
  const [review, setReview] = useState(false);
  return (
    <div>
      <header style={{ padding: "var(--sp-6) var(--sp-5) var(--sp-3)" }}>
        <h1
          style={{
            fontFamily: "var(--ff-head)",
            fontSize: "var(--fs-2xl)",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Meer
        </h1>
      </header>
      <div
        style={{
          padding: "0 var(--sp-4)",
          display: "grid",
          gap: "var(--sp-2)",
        }}
      >
        <LinkCard icon="chart-bar" label="Statistieken" onClick={onOpenStats} />
        <LinkCard
          icon="chat-circle-text"
          label="Weekreview naar Claude"
          onClick={() => setReview(true)}
        />
      </div>
      {children}
      {review && (
        <ReviewSheet
          routines={routines}
          calEvents={calEvents}
          onClose={() => setReview(false)}
        />
      )}
    </div>
  );
}

function LinkCard({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "var(--sp-4) 18px",
        background: "var(--card)",
        borderRadius: "var(--r-lg)",
        color: "var(--text)",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: "var(--accent-bg)",
          color: "var(--accent-text)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={22} />
      </span>
      <span style={{ flex: 1, fontSize: "var(--fs-md)", fontWeight: 600 }}>
        {label}
      </span>
      <Icon
        name="caret-right"
        size={18}
        style={{ color: "var(--text-muted)" }}
      />
    </button>
  );
}
