import s from "./ListRow.module.css";

// Eén tikbare regel in een lijst of menu-sheet (volle breedte, scheidingslijn
// eronder). Inhoud (icoon, tekst, teller) bepaalt de aanroeper.
export default function ListRow({ danger, children, ...rest }) {
  return (
    <button
      type="button"
      className={danger ? `${s.row} ${s.danger}` : s.row}
      {...rest}
    >
      {children}
    </button>
  );
}
