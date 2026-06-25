import { forwardRef } from "react";

const base = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1.5px solid var(--border)",
  fontSize: 13,
  outline: "none",
  background: "var(--input-bg)",
  color: "var(--text)",
};

// Groene focus-border centraal geregeld, zodat elk invoerveld zich gelijk gedraagt.
const focusOn = (e) => (e.target.style.borderColor = "var(--accent)");
const focusOff = (e) => (e.target.style.borderColor = "var(--border)");

export const TextInput = forwardRef(function TextInput(
  { style, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      onFocus={focusOn}
      onBlur={focusOff}
      style={{ ...base, ...style }}
      {...rest}
    />
  );
});

export const TextArea = forwardRef(function TextArea({ style, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      onFocus={focusOn}
      onBlur={focusOff}
      style={{ ...base, lineHeight: 1.5, resize: "vertical", ...style }}
      {...rest}
    />
  );
});

export function Select({ style, children, ...rest }) {
  return (
    <select style={{ ...base, background: "var(--card)", ...style }} {...rest}>
      {children}
    </select>
  );
}

// Label + optionele hint rond een veld.
export function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {label && (
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text)",
            display: "block",
            marginBottom: 4,
          }}
        >
          {label}
        </label>
      )}
      {children}
      {hint && (
        <div
          style={{
            fontSize: 10,
            color: "var(--text-faint)",
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
