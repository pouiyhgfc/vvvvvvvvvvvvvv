import s from "./Card.module.css";

// Witte kaart van ontwerp B. Met `onClick` wordt het een knop (hele kaart
// tikbaar), anders een <section>.
export default function Card({ onClick, children, ...rest }) {
  const Tag = onClick ? "button" : "section";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={s.card}
      {...rest}
    >
      {children}
    </Tag>
  );
}
