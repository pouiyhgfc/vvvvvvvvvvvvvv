const VARIANTS = {
  primary: {
    background: "var(--accent)",
    color: "var(--accent-contrast)",
    border: "1px solid var(--accent)",
  },
  secondary: {
    background: "var(--sunken)",
    color: "var(--text)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--danger-bg)",
    color: "var(--danger-text)",
    border: "1px solid var(--danger-border)",
  },
  dangerSolid: {
    background: "var(--danger-solid)",
    color: "var(--danger-solid-text)",
    border: "1px solid var(--danger-solid)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-muted)",
    border: "1px solid transparent",
  },
};

const SIZES = {
  md: {
    minHeight: 44,
    padding: "0 16px",
    fontSize: "var(--fs-md)",
    borderRadius: "var(--r-md)",
  },
  sm: {
    minHeight: 36,
    padding: "0 12px",
    fontSize: "var(--fs-sm)",
    borderRadius: "var(--r-sm)",
  },
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
