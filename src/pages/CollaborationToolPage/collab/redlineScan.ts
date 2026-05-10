/**
 * Helpers for scanning a Yoopta editor value for redlined text and
 * replacing a redlined span with new text (after AI suggestion approval).
 *
 * Yoopta value shape (simplified):
 *   { [blockId]: { id, type, value: [{ type, children: [{ text, insertion?, deletion?, ... }] }] } }
 *
 * We treat any leaf carrying an `insertion` or `deletion` mark as a redline.
 */

export type RedlineKind = "insertion" | "deletion";

export type RedlineSpan = {
  redlineId: string;
  kind: RedlineKind;
  text: string;
  author?: string;
  createdAt?: string;
};

type Leaf = {
  text?: string;
  insertion?: { redlineId?: string; author?: string; createdAt?: string };
  deletion?: { redlineId?: string; author?: string; createdAt?: string };
};

type SlateNode = { children?: Array<SlateNode | Leaf> } & Leaf;

type YooptaBlockValue = SlateNode[];
type YooptaValue = Record<string, { value?: YooptaBlockValue }>;

const walkLeaves = (
  nodes: Array<SlateNode | Leaf> | undefined,
  visit: (leaf: Leaf, parent: SlateNode | null, index: number) => void,
  parent: SlateNode | null = null,
) => {
  if (!Array.isArray(nodes)) return;
  nodes.forEach((node, index) => {
    if ((node as SlateNode).children) {
      walkLeaves((node as SlateNode).children, visit, node as SlateNode);
    } else {
      visit(node as Leaf, parent, index);
    }
  });
};

/** Extract every redlined span from the current editor value. */
export const extractRedlines = (editorValue: YooptaValue): RedlineSpan[] => {
  const out: RedlineSpan[] = [];
  if (!editorValue || typeof editorValue !== "object") return out;
  for (const block of Object.values(editorValue)) {
    walkLeaves(block?.value as Array<SlateNode | Leaf> | undefined, (leaf) => {
      const text = leaf.text ?? "";
      if (!text.trim()) return;
      if (leaf.insertion) {
        out.push({
          redlineId: leaf.insertion.redlineId || "",
          kind: "insertion",
          text,
          author: leaf.insertion.author,
          createdAt: leaf.insertion.createdAt,
        });
      } else if (leaf.deletion) {
        out.push({
          redlineId: leaf.deletion.redlineId || "",
          kind: "deletion",
          text,
          author: leaf.deletion.author,
          createdAt: leaf.deletion.createdAt,
        });
      }
    });
  }
  // De-dupe by redlineId, keeping the first occurrence (Yoopta may split a mark
  // across multiple leaves if other marks intersect; we treat them as one span).
  const seen = new Set<string>();
  return out.filter((r) => {
    if (!r.redlineId || seen.has(r.redlineId)) return false;
    seen.add(r.redlineId);
    return true;
  });
};

/**
 * Returns a *new* editor value where every leaf belonging to `redlineId`
 * has its mark stripped and its text replaced with `replacement` on the
 * first matching leaf (and emptied on the rest, so the visible text becomes
 * the replacement without duplication).
 */
export const replaceRedline = (
  editorValue: YooptaValue,
  redlineId: string,
  replacement: string,
): YooptaValue => {
  if (!editorValue || typeof editorValue !== "object") return editorValue;
  const cloned: YooptaValue = JSON.parse(JSON.stringify(editorValue));
  let firstApplied = false;
  for (const block of Object.values(cloned)) {
    walkLeaves(block?.value as Array<SlateNode | Leaf> | undefined, (leaf) => {
      const ins = leaf.insertion;
      const del = leaf.deletion;
      const matches =
        (ins && ins.redlineId === redlineId) ||
        (del && del.redlineId === redlineId);
      if (!matches) return;
      if (!firstApplied) {
        leaf.text = replacement;
        firstApplied = true;
      } else {
        leaf.text = "";
      }
      delete leaf.insertion;
      delete leaf.deletion;
    });
  }
  return cloned;
};
