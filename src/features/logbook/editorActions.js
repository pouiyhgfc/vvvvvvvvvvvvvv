// Pure, benoemde acties op een BlockNote-editor. Gedeeld door het touch-handvat
// en de blok-sheet, zodat er één plek is met de (tegen 0.51.4 geverifieerde)
// API-aanroepen. Elke functie neemt `editor` als eerste argument.
//
// Geverifieerde bindingen (node_modules/@blocknote/core 0.51.4):
// - editor.getTextCursorPosition().block          → actief blok bij de cursor
// - editor.updateBlock(block, { type, props })    → bloktype wisselen
// - editor.toggleStyles({ [key]: true })          → inline-stijl togglen
// - editor.getActiveStyles()                      → actieve stijlen lezen
// - editor.nestBlock/unnestBlock/canNestBlock/canUnnestBlock
// - editor.moveBlocksUp/moveBlocksDown(id?)       → op het cursor-blok
// - editor.insertBlocks(blocks, ref, "before"|"after")
// - editor.removeBlocks([block])
// - editor.getExtension("suggestionMenu").openSuggestionMenu("/")

// Verwijdert id's recursief zodat een gedupliceerd blok (incl. geneste children)
// verse id's krijgt en niet botst met het origineel.
function cloneWithoutIds(block) {
  const { id: _id, children, ...rest } = block;
  return {
    ...rest,
    ...(children ? { children: children.map(cloneWithoutIds) } : {}),
  };
}

function getActiveBlock(editor) {
  return editor.getTextCursorPosition()?.block ?? null;
}

export function setBlockType(editor, type, props) {
  const block = getActiveBlock(editor);
  if (!block) return;
  editor.updateBlock(block, props ? { type, props } : { type });
}

export function toggleStyle(editor, key) {
  editor.toggleStyles({ [key]: true });
}

export function setBlockColor(editor, block, backgroundColor) {
  editor.updateBlock(block, { props: { backgroundColor } });
}

export function moveUp(editor, block) {
  editor.moveBlocksUp(block?.id);
}

export function moveDown(editor, block) {
  editor.moveBlocksDown(block?.id);
}

export function duplicateBlock(editor, block) {
  editor.insertBlocks([cloneWithoutIds(block)], block, "after");
}

// Verplaatst een blok naar een doelpositie (vrij slepen). Verwijderen +
// invoegen in ÉÉN transactie (BlockNote's eigen interne drop-patroon): faalt
// er iets, dan wordt niets toegepast — geen halve verplaatsing die het blok
// dupliceert of kwijtraakt.
export function moveBlock(editor, block, targetId, placement) {
  if (!targetId || targetId === block.id) return;
  editor.transact(() => {
    editor.removeBlocks([block]);
    editor.insertBlocks([cloneWithoutIds(block)], targetId, placement);
  });
}

// Kopieert één of meer blokken naar het klembord als HTML én platte tekst.
// - HTML (blocksToFullHTML): tabellen reizen NIET verliesvrij naar markdown, dus
//   zonder HTML plakt een gekopieerde tabel kapot terug. HTML rond-reist wel.
// - text/plain (markdown): zodat plakken in een ander programma leesbaar blijft.
// De aanroeper moet dit awaiten vóór het editor.focus()/sluiten aanroept, anders
// wordt de asynchrone klembord-schrijf halverwege afgebroken.
export async function copyBlocks(editor, blocks) {
  if (!blocks?.length) return;
  const html = editor.blocksToFullHTML(blocks);
  const text = await editor.blocksToMarkdownLossy(blocks);
  if (navigator.clipboard?.write && typeof ClipboardItem === "function") {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" }),
      }),
    ]);
  } else {
    await navigator.clipboard?.writeText(text);
  }
}

export function removeBlock(editor, block) {
  editor.removeBlocks([block]);
}

// Opent het slash-menu zonder een "/" in de tekst te zetten
// (deleteTriggerCharacter: false heeft een eigen anker-pad in de plugin).
// Nodig op Android: getypte "/" komt daar via IME-compositie binnen en
// triggert ProseMirror's handleTextInput niet. Let op: de aanroepende knop
// moet preventDefault doen op pointerdown, anders verliest de editor focus
// en sluit de focus-wissel het menu direct weer.
export function openSlashMenu(editor) {
  editor
    .getExtension("suggestionMenu")
    ?.openSuggestionMenu("/", { deleteTriggerCharacter: false });
}
