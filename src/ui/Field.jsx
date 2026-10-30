import { forwardRef } from "react";
import s from "./Field.module.css";

// Groene focus-rand centraal geregeld, zodat elk invoerveld zich gelijk gedraagt.
const focusOn = (e) => (e.target.style.borderColor = "var(--accent)");
const focusOff = (e) => (e.target.style.borderColor = "transparent");

export const TextInput = forwardRef(function TextInput(props, ref) {
  return (
    <input
      ref={ref}
      type="text"
      // Arabisch/Tarifit-tekst loopt dan vanzelf van rechts naar links.
      dir="auto"
      onFocus={focusOn}
      onBlur={focusOff}
      className={s.input}
      {...props}
    />
  );
});

export const TextArea = forwardRef(function TextArea(props, ref) {
  return (
    <textarea
      ref={ref}
      dir="auto"
      onFocus={focusOn}
      onBlur={focusOff}
      className={`${s.input} ${s.area}`}
      {...props}
    />
  );
});

export function Select({ children, ...rest }) {
  return (
    <select className={s.input} {...rest}>
      {children}
    </select>
  );
}

// Label + optionele hint rond een veld.
export function Field({ label, hint, children }) {
  return (
    <div className={s.field}>
      {label && <label className={s.label}>{label}</label>}
      {children}
      {hint && <div className={s.hint}>{hint}</div>}
    </div>
  );
}
