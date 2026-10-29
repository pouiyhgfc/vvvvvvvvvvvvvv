// Id's van de notities waarnaar een document linkt (inline "noteLink", ook
// in tabellen en geneste blokken). Loopt de hele JSON door.
export function linkedNoteIds(doc) {
  const ids = new Set();
  const walk = (x) => {
    if (Array.isArray(x)) x.forEach(walk);
    else if (x && typeof x === "object") {
      if (x.type === "noteLink" && x.props?.id) ids.add(x.props.id);
      Object.values(x).forEach(walk);
    }
  };
  walk(doc);
  return [...ids];
}
