// Cross-client version history backed by the Yjs document.
//
// Why Yjs and not REST: there's no backend endpoint for version
// snapshots today. Yjs already syncs the editor content across users
// over the existing collab WS, so we piggyback on that — version
// metadata in a `Y.Array`, snapshot payloads in a `Y.Map` keyed by
// version id. Every client in the same room sees the same timeline
// and can restore any entry.
//
// Trade-offs:
//   • Each snapshot is a full serialized editor JSON (~few KB). With
//     the 50-entry cap that's roughly 100-500 KB in the Y.Doc state.
//     Initial sync of a new client pays this cost once. Acceptable for
//     contract review.
//   • Snapshots are stored as STRINGIFIED JSON in the Y.Map (not as Y
//     data structures) — Yjs treats them as opaque blobs which keeps
//     the per-op overhead low.
//   • Restore is a CRDT broadcast, not a wholesale rollback: if user
//     B is editing while user A clicks Restore, B's in-flight ops
//     merge with the restored state via Yjs semantics. Documented in
//     the migration memory note (`project_collab_tiptap_migration.md`).
//
// If/when a proper BE endpoint exists, swap this hook out — the
// `index.tsx` consumer treats it as a black box that exposes
// `versions`, `addVersion`, `removeVersion`, and `getSnapshot`.

import { useCallback, useEffect, useMemo, useState } from "react";
import type * as Y from "yjs";
import type { Version, VersionKind } from "../components/VersionHistoryModal";

const META_KEY = "ct:versions";
const SNAPSHOT_KEY = "ct:version-snapshots";
const VERSION_CAP = 50;

type AddArgs = {
  label: string;
  kind: VersionKind;
  author: string;
  snapshot: unknown;
};

export function useCollabVersions(doc: Y.Doc | undefined) {
  // Memo the live Y types so subsequent calls reuse the same handles
  // (Y.Doc.getArray / getMap are idempotent but the binding object
  // identity matters for observer cleanup).
  const yArray = useMemo(() => doc?.getArray<Version>(META_KEY), [doc]);
  const yMap = useMemo(() => doc?.getMap<string>(SNAPSHOT_KEY), [doc]);

  const [versions, setVersions] = useState<Version[]>(() =>
    yArray ? yArray.toArray() : [],
  );

  // Subscribe to remote changes so other clients' new versions appear
  // here without polling.
  useEffect(() => {
    if (!yArray) return;
    setVersions(yArray.toArray());
    const handler = () => setVersions(yArray.toArray());
    yArray.observe(handler);
    return () => yArray.unobserve(handler);
  }, [yArray]);

  const addVersion = useCallback(
    ({ label, kind, author, snapshot }: AddArgs) => {
      if (!yArray || !yMap || !doc) return;
      const version: Version = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        author,
        label,
        kind,
      };
      doc.transact(() => {
        // Newest first — unshift via insert(0).
        yArray.insert(0, [version]);
        try {
          yMap.set(version.id, JSON.stringify(snapshot));
        } catch {
          // If the snapshot can't be stringified, the version metadata
          // still lives in the list but Restore will no-op. Acceptable
          // degradation vs. losing the timeline entry entirely.
        }
        // Enforce the cap inside the same transaction so peers see one
        // atomic update, not two.
        const overflow = yArray.length - VERSION_CAP;
        if (overflow > 0) {
          const dropped = yArray.slice(VERSION_CAP);
          yArray.delete(VERSION_CAP, overflow);
          for (const v of dropped) yMap.delete(v.id);
        }
      });
    },
    [doc, yArray, yMap],
  );

  const removeVersion = useCallback(
    (id: string) => {
      if (!yArray || !yMap || !doc) return;
      const idx = yArray.toArray().findIndex((v) => v.id === id);
      if (idx < 0) return;
      doc.transact(() => {
        yArray.delete(idx, 1);
        yMap.delete(id);
      });
    },
    [doc, yArray, yMap],
  );

  const getSnapshot = useCallback(
    (id: string): unknown | null => {
      if (!yMap) return null;
      const raw = yMap.get(id);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    [yMap],
  );

  return { versions, addVersion, removeVersion, getSnapshot };
}
