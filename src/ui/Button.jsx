import s from "./Button.module.css";

// Knop in een van de vaste varianten (primary/secondary/danger/dangerSolid/
// ghost) en maten (md/sm). `style` blijft voor uitzonderingen per plek.
export default function Button({
  variant = "primary",
  size = "md",
  full = false,
  className,
  children,
  ...rest
}) {
  const classes = [s.btn, s[variant], s[size], full && s.full, className];
  return (
    <button className={classes.filter(Boolean).join(" ")} {...rest}>
      {children}
    </button>
  );
}
