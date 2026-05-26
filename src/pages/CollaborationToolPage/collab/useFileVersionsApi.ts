import { useMutation, useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import type { Version, VersionKind } from "../components/VersionHistoryModal";

// Backend version row returned by GET /file/versions/{docName}. Swagger
// 2.3.0 documents these fields under `data.versions[]`.
type BeFileVersion = {
  id?: string;
  versionId: string;
  name?: string;
  type?: string;
  size?: number;
  source?: string;
  snapshotKind?: "full" | "delta";
  previousVersionId?: string | null;
  isActive?: boolean;
  updatedBy?: string;
  createdAt: string;
};

type BeFileVersionsResponse = {
  status?: number;
  message?: string;
  data?: {
    activeVersionId?: string | null;
    versions?: BeFileVersion[];
  } | null;
};

// `source` strings the BE uses today (e.g. "collab", "upload"). Mapped
// onto the existing UI VersionKind palette so the timeline icons stay
// consistent with local snapshots.
const kindFromSource = (source?: string, snapshotKind?: string): VersionKind => {
  const s = (source || "").toLowerCase();
  if (s === "upload") return "edit";
  if (s === "collab") return snapshotKind === "delta" ? "edit" : "edit";
  return "edit";
};

const labelFromVersion = (v: BeFileVersion): string => {
  if (v.isActive) return "Active version";
  if (v.source === "upload") return "Uploaded snapshot";
  if (v.source === "collab") return "Collab snapshot";
  return v.name || "Saved version";
};

const toUiVersion = (v: BeFileVersion): Version => ({
  // versionId is unique and stable per BE; prefer it over the Mongo id
  // so the same record keys consistently across refetches.
  id: v.versionId || v.id || `${v.createdAt}`,
  timestamp: v.createdAt,
  // BE only returns the updater's ObjectId — there's no name in this
  // response. Use a placeholder; this can be enriched later if BE adds
  // populated user fields.
  author: v.updatedBy ? "Team member" : "Unknown User",
  label: labelFromVersion(v),
  kind: kindFromSource(v.source, v.snapshotKind),
  source: "be",
});

/**
 * Lists server-persisted versions for a collab document.
 * Swagger: GET /file/versions/{docName}
 *
 * The axios baseURL is /api/v1/dev; swagger paths live under /contract,
 * so we self-prefix here.
 */
export function useFileVersions(docName: string | undefined) {
  return useQuery<{ versions: Version[]; activeVersionId: string | null }>({
    queryKey: ["collab-file-versions", docName],
    enabled: Boolean(docName),
    staleTime: 15_000,
    queryFn: async () => {
      if (!docName) return { versions: [], activeVersionId: null };
      const res = await getRequest({
        url: `/contract/file/versions/${encodeURIComponent(docName)}`,
      });
      const body = res.data as BeFileVersionsResponse | undefined;
      const rows = body?.data?.versions ?? [];
      return {
        versions: rows.map(toUiVersion),
        activeVersionId: body?.data?.activeVersionId ?? null,
      };
    },
  });
}

const parseFilenameFromDisposition = (disposition: string | undefined): string | null => {
  if (!disposition) return null;
  // Handle both `filename="x.yjs"` and `filename=x.yjs`
  const match = /filename\*?=(?:UTF-8'')?["']?([^"';\n]+)["']?/i.exec(
    disposition,
  );
  return match ? decodeURIComponent(match[1]) : null;
};

/**
 * Downloads the latest collab snapshot as a binary .yjs file.
 * Swagger: GET /collab-export/{docName}/download (application/octet-stream)
 *
 * Triggers a browser download via a temporary object URL — the response
 * is opaque binary, so there's no JSON to inspect.
 */
export function useDownloadLatestCollab() {
  return useMutation<void, unknown, { docName: string }>({
    mutationKey: ["collab-export-download"],
    mutationFn: async ({ docName }) => {
      if (!docName) throw new Error("docName required");
      const res = await getRequest({
        url: `/contract/collab-export/${encodeURIComponent(docName)}/download`,
        config: { responseType: "blob" },
      });

      const blob = new Blob([res.data], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        parseFilenameFromDisposition(
          (res.headers as Record<string, string> | undefined)?.[
            "content-disposition"
          ],
        ) || `${docName}.yjs`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
