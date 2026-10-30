import { forwardRef } from "react";
import s from "./Field.module.css";

export const TextInput = forwardRef(function TextInput(props, ref) {
  return (
    <input
      ref={ref}
      type="text"
      // Arabisch/Tarifit-tekst loopt dan vanzelf van rechts naar links.
      dir="auto"
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
