export default function Ring({
  value,
  size = 90,
  stroke = 7,
  label,
  color = "var(--accent)",
}) {
  const r = (size - stroke) / 2,
    c = 2 * Math.PI * r,
    off = c - (value / 100) * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: "var(--border-soft)" }}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset .6s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: size * 0.26,
            fontWeight: 800,
            color: "var(--text)",
            fontFamily: "var(--ff-head)",
          }}
        >
          {value}%
        </span>
        {label && (
          <span
            style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
