// Derives the Yjs collaboration room id (also used as the IndexedDB
// persistence key and the BE `docName` for version history). The room
// must be unique per (contract, document) pair: opening the SAME file
// from two DIFFERENT contracts has to land in two independent rooms,
// otherwise edits, presence, and version history leak across contracts.
//
// Priority:
//   1. `collabDoc` — explicit `?doc=` pin (ops override) always wins.
//   2. `contractId:<doc>` — contract-scoped key (the normal flow). The
//      document part prefers `fileId` (stable, unique) over `fileName`.
//   3. The bare document identifier when no contract is in context
//      (ad-hoc / legacy opens).
//   4. `collab:editor` — last-resort shared key when nothing identifies
//      the document.
export function deriveRoomId(params: {
  collabDoc?: string;
  fileId?: string;
  fileName?: string;
  contractId?: string;
}): string {
  const { collabDoc, fileId, fileName, contractId } = params;
  if (collabDoc) return collabDoc;
  const docKey = fileId || fileName;
  if (contractId && docKey) return `${contractId}:${docKey}`;
  return docKey || contractId || "collab:editor";
}
