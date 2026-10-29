import { forwardRef } from "react";

// Stijl B: zacht vlak zonder rand, 44px hoog (duimmaat) en 16px tekst.
const base = {
  width: "100%",
  minHeight: 44,
  padding: "10px 12px",
  borderRadius: "var(--r-md)",
  border: "1.5px solid transparent",
  fontSize: "var(--fs-md)",
  outline: "none",
  background: "var(--input-bg)",
  color: "var(--text)",
};

// Groene focus-rand centraal geregeld, zodat elk invoerveld zich gelijk gedraagt.
const focusOn = (e) => (e.target.style.borderColor = "var(--accent)");
const focusOff = (e) => (e.target.style.borderColor = "transparent");

export const TextInput = forwardRef(function TextInput(
  { style, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type="text"
      // Arabisch/Tarifit-tekst loopt dan vanzelf van rechts naar links.
      dir="auto"
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
      dir="auto"
      onFocus={focusOn}
      onBlur={focusOff}
      style={{ ...base, lineHeight: 1.5, resize: "vertical", ...style }}
      {...rest}
    />
  );
});

export function Select({ style, children, ...rest }) {
  return (
    <select style={{ ...base, ...style }} {...rest}>
      {children}
    </select>
  );
}

// Label + optionele hint rond een veld.
export function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label
          style={{
            fontSize: "var(--fs-sm)",
            fontWeight: 600,
            color: "var(--text-muted)",
            display: "block",
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      {children}
      {hint && (
        <div
          style={{
            fontSize: "var(--fs-xs)",
            color: "var(--text-muted)",
            marginTop: 6,
            lineHeight: 1.4,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
