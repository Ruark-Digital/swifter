// Derives the Yjs collaboration room id (also used as the IndexedDB
// persistence key and the BE `docName` for version history). Keyed by the
// document's own identifier — `fileId` is a stable, globally-unique document
// id — so the same document resolves to the same room (and version history)
// wherever it's opened. The contract is NOT part of the key: a document
// belongs to a single contract, so its id already scopes it.
//
// Priority:
//   1. `collabDoc` — explicit `?doc=` pin (ops override) always wins.
//   2. `fileId` / `fileName` — the document identifier (the normal flow);
//      `fileId` is preferred as it's stable and unique.
//   3. `contractId` — only when nothing identifies the document.
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
  return fileId || fileName || contractId || "collab:editor";
}
