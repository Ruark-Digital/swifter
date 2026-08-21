import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download, Edit, ScanText, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";
import type { ApiResponseError } from "@/types";

export type DocType = {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
  icon: React.ReactNode;
  /** Real Mongo ObjectId of the file (when the source object had one). Kept
   *  separate from the synthetic list `id` (which falls back to
   *  `${name}-${index}`) so we never send that fallback to the analyze API. */
  fileId?: string;
};

// Isolated in its own component so the react-query / role hooks it needs only
// run when the parent actually wires up the analyze action (i.e. inside the
// app's providers). DocumentItem's existing bare-render tests pass no
// `onAnalyzed`, so this never mounts there and stays QueryClient-free.
// (`useUserRole` itself calls `useQuery`, so it too must live here.)
const AnalyzeDocumentButton = ({
  d,
  contractId,
  contractType,
  onAnalyzed,
}: {
  d: DocType;
  contractId?: string;
  contractType: "Contract" | "MsaContract";
  onAnalyzed: () => void;
}) => {
  const { success, error } = useToastHandler();
  const { isManager, isCompanyAdmin } = useUserRole();
  const qc = useQueryClient();

  // Endpoint accepts ObjectId, name, or URL. Prefer the real _id; fall back to
  // the file URL (never the synthetic list id).
  const analyzeId = d.fileId || d.url || "";

  const analyzeMutation = useMutation({
    mutationKey: [
      "clause-library",
      "analyze-file",
      contractType,
      contractId,
      analyzeId,
    ],
    mutationFn: async () => {
      const segment =
        contractType === "MsaContract" ? "msa-contracts" : "contracts";
      return await postRequest({
        url: `/contract/manager/${segment}/${contractId}/clauses/file/${encodeURIComponent(analyzeId)}`,
        payload: {},
      });
    },
    onSuccess: (res) => {
      success("Clause Library", res?.data?.message || "Clause analysis updated");
      qc.invalidateQueries({
        queryKey: ["contract-clause-library", contractType, contractId],
      });
      onAnalyzed();
    },
    onError: (err: ApiResponseError) => {
      error("Clause Library", err);
    },
  });

  // Endpoint x-roles: contract_manager, procurement (isManager), company_admin.
  if (!(isManager || isCompanyAdmin)) return null;

  const handleAnalyze = () => {
    if (!contractId || !analyzeId || analyzeMutation.isPending) return;
    analyzeMutation.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Analyze in Clause Library"
      title="Analyze in Clause Library"
      disabled={!analyzeId || analyzeMutation.isPending}
      onClick={handleAnalyze}
    >
      {analyzeMutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ScanText className="h-4 w-4" />
      )}
    </Button>
  );
};

export const DocumentItem = ({
  d,
  contractId,
  canEdit,
  navigate,
  handlePreview,
  handleDownload,
  contractType = "Contract",
  onAnalyzed,
}: {
  d: DocType;
  contractId?: string;
  canEdit?: boolean;
  navigate?: (path: string) => void;
  handlePreview?: (d: DocType) => void;
  handleDownload?: (d: DocType) => void;
  /** Which clause endpoint family to hit — `contracts` vs `msa-contracts`. */
  contractType?: "Contract" | "MsaContract";
  /** Called after a successful clause (re)analysis. The parent uses this to
   *  switch to the Clause Library tab. Its presence ALSO gates the analyze
   *  action: parents only pass it when a Clause Library tab is visible (it's
   *  hidden on draft records), so the button never targets a hidden tab. */
  onAnalyzed?: () => void;
}) => {
  return (
    <Card key={d.id} className="border-slate-200 dark:border-slate-700 dark:bg-slate-900">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`h-10 w-10`}>{d.icon}</div>

        <div className="flex-1">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{d.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {d.type} • {d.size}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Preview"
            onClick={() => handlePreview?.(d)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {onAnalyzed && (
            <AnalyzeDocumentButton
              d={d}
              contractId={contractId}
              contractType={contractType}
              onAnalyzed={onAnalyzed}
            />
          )}
          {canEdit && d.type?.toLowerCase() === "docx" && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit in Collaboration Tool"
              title="Edit in Collaboration Tool"
              onClick={() =>
                navigate?.(
                  // SuperDoc is the default editor. The legacy TipTap/Yoopta
                  // panels stay reachable via `?editor=tiptap` / `?editor=yoopta`.
                  `/collaboration-tool?sourceUrl=${encodeURIComponent(d.url || "")}&fileName=${encodeURIComponent(d.name)}&fileType=${encodeURIComponent(d.type || "")}${contractId ? `&contractId=${encodeURIComponent(contractId)}` : ""}${d.id ? `&fileId=${encodeURIComponent(d.id)}` : ""}&editor=superdoc`,
                )
              }
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Download"
            onClick={() => handleDownload?.(d)}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
