import { useRef } from "react";

// Beschermt een net geopende sheet of dialoog tegen een "spookklik": op touch
// komt de klik van de tik die het paneel opende soms pas ná het openen binnen,
// en landt dan op een knop in het nieuwe paneel (of op de achtergrond, die het
// paneel weer sluit). Regel: een klik telt alleen als de vinger/muis ook ín
// het paneel neerkwam. Toetsenbord-klikken (Enter/spatie, detail 0) mogen altijd.
// Gebruik: <div {...useGhostClickShield()}> op het buitenste element.
export function useGhostClickShield() {
  const pressedInside = useRef(false);
  return {
    onPointerDownCapture: () => {
      pressedInside.current = true;
    },
    onClickCapture: (e) => {
      if (!pressedInside.current && e.detail !== 0) {
        e.stopPropagation();
        e.preventDefault();
      }
      pressedInside.current = false;
    },
  };
}
