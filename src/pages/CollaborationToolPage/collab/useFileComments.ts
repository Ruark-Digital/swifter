import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import type { Mentionable } from "./useContractMentionables";

/**
 * Rich comment shape used by the collaboration tool — supports threading,
 * redline linkage and @mentions.
 */
export type FileCommentRich = {
  id: string;
  author: string;
  createdAt: string;
  content: string;
  redlineId?: string | null;
  redlineKind?: "insertion" | "deletion" | null;
  /** SuperDoc document-comment id this comment is anchored to (click-to-scroll). */
  anchorCommentId?: string | null;
  mentions?: Mentionable[];
};

/**
 * Wire shape the backend `/file-comment/{fileId}` endpoint accepts/returns.
 * Per the live API each item is `{ author, text, date, _id }` — `_id` is
 * assigned by the server on insert and is stable across refetches.
 */
type FileCommentWire = {
  author: string;
  text: string;
  date: string;
  _id?: string;
};

/**
 * Sentinel used to round-trip rich metadata inside the `text` field.
 * If `text` is JSON with this marker we decode the rich fields; otherwise
 * the comment is treated as plain content (legacy / non-collab clients).
 */
const SENTINEL_KEY = "__ct__";

const encodeRichToWire = (rich: FileCommentRich): FileCommentWire => {
  const meta: Record<string, unknown> = { [SENTINEL_KEY]: 1, id: rich.id };
  if (rich.redlineId) meta.redlineId = rich.redlineId;
  if (rich.redlineKind) meta.redlineKind = rich.redlineKind;
  if (rich.anchorCommentId) meta.anchorCommentId = rich.anchorCommentId;
  if (rich.mentions && rich.mentions.length > 0) meta.mentions = rich.mentions;
  meta.content = rich.content;
  return {
    author: rich.author,
    date: rich.createdAt,
    text: JSON.stringify(meta),
  };
};

const decodeWireToRich = (
  wire: FileCommentWire,
  index: number,
): FileCommentRich => {
  // Prefer the server-assigned `_id` so React keys stay stable across
  // refetches; fall back to the sentinel-embedded `id` (set client-side
  // for optimistic updates), then to a synthetic key.
  const fallbackId = wire._id || `${wire.date}-${index}`;
  const base: FileCommentRich = {
    id: fallbackId,
    author: wire.author || "Unknown User",
    createdAt: wire.date || new Date().toISOString(),
    content: wire.text ?? "",
  };

  if (typeof wire.text !== "string" || !wire.text.startsWith("{")) return base;

  try {
    const parsed = JSON.parse(wire.text);
    if (!parsed || parsed[SENTINEL_KEY] !== 1) return base;
    return {
      // Server `_id` takes precedence — it's the canonical identity.
      // The client-set sentinel `id` is only used when the wire item
      // has no `_id` (e.g., optimistic local entries before save).
      id: wire._id || (typeof parsed.id === "string" ? parsed.id : base.id),
      author: base.author,
      createdAt: base.createdAt,
      content: typeof parsed.content === "string" ? parsed.content : "",
      redlineId: typeof parsed.redlineId === "string" ? parsed.redlineId : null,
      redlineKind:
        parsed.redlineKind === "insertion" || parsed.redlineKind === "deletion"
          ? parsed.redlineKind
          : null,
      anchorCommentId:
        typeof parsed.anchorCommentId === "string" ? parsed.anchorCommentId : null,
      mentions: Array.isArray(parsed.mentions) ? parsed.mentions : undefined,
    };
  } catch {
    return base;
  }
};

type FileCommentListResponse = {
  status?: number;
  message?: string;
  // Live API shape: `data` is the container document for the file with a
  // `comments` array (plural). Older swagger drafts called it `comment`
  // (singular) — we accept either for safety.
  data?: {
    _id?: string;
    company?: string;
    file?: string;
    comments?: FileCommentWire[];
    comment?: FileCommentWire[];
  } | null;
};

type FileCommentSaveResponse = FileCommentListResponse;

/**
 * Lists comments attached to a file via the public file-comment endpoint.
 * Swagger: GET /file-comment/{fileId}
 */
export function useFileComments(fileId: string | undefined) {
  return useQuery<FileCommentRich[]>({
    queryKey: ["file-comments", fileId],
    enabled: Boolean(fileId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!fileId) return [];
      const res = await getRequest({ url: `/contract/file-comment/${fileId}` });
      const body = res.data as FileCommentListResponse | undefined;
      const wire =
        body?.data?.comments ?? body?.data?.comment ?? [];
      return wire.map((w, i) => decodeWireToRich(w, i));
    },
  });
}

/**
 * Posts a rich comment to the file-comment endpoint.
 * Swagger: POST /file-comment/{fileId} body { author, text, date }
 */
export function useAddFileComment(fileId: string | undefined) {
  const qc = useQueryClient();
  return useMutation<FileCommentRich, unknown, FileCommentRich>({
    mutationKey: ["file-comments-add", fileId],
    mutationFn: async (rich) => {
      if (!fileId) throw new Error("fileId required");
      const wire = encodeRichToWire(rich);
      await postRequest({ url: `/contract/file-comment/${fileId}`, payload: wire });
      return rich;
    },
    onSuccess: (rich) => {
      qc.setQueryData<FileCommentRich[] | undefined>(
        ["file-comments", fileId],
        (prev) => (prev ? [rich, ...prev] : [rich]),
      );
      qc.invalidateQueries({ queryKey: ["file-comments", fileId] });
    },
  });
}

export type { FileCommentSaveResponse };
