// Draait de opstartstappen (migraties, opschonen) één voor één. Een mislukte
// stap blokkeert de app niet, maar wordt ook niet meer stil ingeslikt: de
// namen van mislukte stappen komen terug zodat de app ze kan tonen.
export async function runStartup(steps) {
  const failed = [];
  for (const [label, step] of steps) {
    try {
      await step();
    } catch (err) {
      console.error(`[opstart] ${label}`, err);
      failed.push(label);
    }
  }
  return failed;
}
