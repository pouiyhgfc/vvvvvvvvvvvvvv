// Mini toast-store, los van de component zodat React Fast Refresh blij blijft.
// ToastHost registreert zich; showToast() roept overal in de app een melding op.
let pushFn = null;

export function registerToast(fn) {
  pushFn = fn;
  return () => {
    if (pushFn === fn) pushFn = null;
  };
}

export function showToast(message) {
  if (pushFn) pushFn(message);
}
