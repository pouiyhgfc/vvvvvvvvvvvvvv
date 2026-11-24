// Telt bewerkingen, zodat "opgeslagen" alleen geldt voor wat er al was toen
// het schrijven begon. Een toetsaanslag tijdens het schrijven blijft dirty.
export function editCounter(startDirty) {
  let edits = startDirty ? 1 : 0;
  let saved = 0;
  return {
    edit: () => {
      edits++;
    },
    isDirty: () => edits !== saved,
    start: () => {
      const at = edits;
      return () => {
        saved = Math.max(saved, at);
      };
    },
  };
}
