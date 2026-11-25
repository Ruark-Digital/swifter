import type { RedlineSpan } from "./redlineScan";

/**
 * Pure helpers that keep the Redline panel's cards consistent with (a) the
 * shared persisted suggestion list and (b) the tracked changes actually present
 * in THIS client's document.
 */

type ItemLike = {
  redline: RedlineSpan;
  state: "pending" | "approved" | "dismissed";
};

/**
 * Copy the live editor's kind and replacement parts onto cards that lack them.
 * Cards rehydrated from the persisted list carry only `sourceText` (a replacement
 * reads "ProfilePrincipal"); the editor knows the real deleted / inserted text,
 * but may report it after the cards were built. Returns the same array when
 * nothing changes.
 */
export const enrichWithLive = <T extends ItemLike>(
  items: T[],
  live: RedlineSpan[],
): T[] => {
  if (items.length === 0 || live.length === 0) return items;
  const byId = new Map(live.map((r) => [r.redlineId, r] as const));
  let changed = false;
  const next = items.map((item) => {
    const l = byId.get(item.redline.redlineId);
    if (!l) return item;
    const needsParts =
      Boolean(l.deletedText && l.insertedText) &&
      !(item.redline.deletedText && item.redline.insertedText);
    if (!needsParts && item.redline.kind === l.kind) return item;
    changed = true;
    return {
      ...item,
      redline: {
        ...item.redline,
        kind: l.kind,
        ...(needsParts
          ? { deletedText: l.deletedText, insertedText: l.insertedText }
          : {}),
      },
    };
  });
  return changed ? next : items;
};

/**
 * Ids of still-pending cards whose tracked change is not in this document, i.e.
 * the suggestion no longer applies here (accepted or rejected elsewhere, edited
 * away, or this client's document diverged from the room). Empty until the
 * editor has reported its redlines at least once (`liveLoaded`), so a slow load
 * is not read as "everything is stale". Resolved cards are excluded: an applied
 * redline is expected to be gone.
 */
export const stalePendingIds = <T extends ItemLike>(
  items: T[],
  live: RedlineSpan[],
  liveLoaded: boolean,
): string[] => {
  if (!liveLoaded) return [];
  const liveIds = new Set(live.map((r) => r.redlineId));
  return items
    .filter((i) => i.state === "pending" && !liveIds.has(i.redline.redlineId))
    .map((i) => i.redline.redlineId);
};
