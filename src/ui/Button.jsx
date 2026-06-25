const VARIANTS = {
  primary: {
    background: "var(--accent)",
    color: "var(--accent-contrast)",
    border: "1px solid var(--accent)",
  },
  secondary: {
    background: "var(--card2)",
    color: "var(--text)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--danger-text)",
    border: "1px solid var(--danger-border)",
  },
  dangerSolid: {
    background: "#dc2626",
    color: "#ffffff",
    border: "1px solid #dc2626",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-muted)",
    border: "1px solid transparent",
  },
};

const SIZES = {
  md: { padding: "11px 14px", fontSize: 14, borderRadius: 9 },
  sm: { padding: "6px 10px", fontSize: 12, borderRadius: 6 },
};

export default function Button({
  variant = "primary",
  size = "md",
  full = false,
  disabled = false,
  style,
  children,
  ...rest
}) {
  return (
    <button
      disabled={disabled}
      style={{
        ...VARIANTS[variant],
        ...SIZES[size],
        fontWeight: 600,
        width: full ? "100%" : undefined,
        opacity: disabled ? 0.5 : 1,
        transition: "opacity .15s, background .15s",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
