import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Eye, Download, Edit, ScanText, Loader2, MoreVertical } from "lucide-react";
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

const buildCollaborationHref = (d: DocType, contractId?: string) =>
  // SuperDoc is the default editor. The legacy TipTap/Yoopta panels stay
  // reachable via `?editor=tiptap` / `?editor=yoopta`.
  `/collaboration-tool?sourceUrl=${encodeURIComponent(d.url || "")}&fileName=${encodeURIComponent(d.name)}&fileType=${encodeURIComponent(d.type || "")}${contractId ? `&contractId=${encodeURIComponent(contractId)}` : ""}${d.id ? `&fileId=${encodeURIComponent(d.id)}` : ""}&editor=superdoc`;

// Presentational kebab menu — no data hooks, so it can render anywhere
// (including DocumentItem's provider-free unit tests). The analyze action is
// injected as an optional `analyzeItem` node by the hook-bearing wrapper.
const DocumentActionsMenu = ({
  d,
  contractId,
  canEdit,
  navigate,
  handlePreview,
  handleDownload,
  analyzeItem,
}: {
  d: DocType;
  contractId?: string;
  canEdit?: boolean;
  navigate?: (path: string) => void;
  handlePreview?: (d: DocType) => void;
  handleDownload?: (d: DocType) => void;
  analyzeItem?: React.ReactNode;
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Document actions"
          data-testid="document-actions-dropdown"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => handlePreview?.(d)}>
          <Eye className="mr-2 h-4 w-4" /> Preview
        </DropdownMenuItem>
        {analyzeItem}
        {canEdit && d.type?.toLowerCase() === "docx" && (
          <DropdownMenuItem
            onSelect={() => navigate?.(buildCollaborationHref(d, contractId))}
          >
            <Edit className="mr-2 h-4 w-4" /> Edit in Collaboration Tool
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => handleDownload?.(d)}>
          <Download className="mr-2 h-4 w-4" /> Download
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Owns the clause-analysis mutation and the role/toast hooks. Wraps the whole
// menu (rather than living inside DropdownMenuContent) so it stays mounted when
// the menu closes on select — otherwise the mutation observer would unmount
// before onSuccess fires. `useUserRole` also calls `useQuery`, so it too must
// stay inside the app's providers; DocumentItem only renders this when the
// parent wires `onAnalyzed`, and the tests never do — keeping them hook-free.
const AnalyzeCapableActions = ({
  d,
  contractId,
  contractType,
  onAnalyzed,
  canEdit,
  navigate,
  handlePreview,
  handleDownload,
}: {
  d: DocType;
  contractId?: string;
  contractType: "Contract" | "MsaContract";
  onAnalyzed: () => void;
  canEdit?: boolean;
  navigate?: (path: string) => void;
  handlePreview?: (d: DocType) => void;
  handleDownload?: (d: DocType) => void;
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

  const handleAnalyze = () => {
    if (!contractId || !analyzeId || analyzeMutation.isPending) return;
    analyzeMutation.mutate();
  };

  // Endpoint x-roles: contract_manager, procurement (isManager), company_admin.
  const analyzeItem =
    isManager || isCompanyAdmin ? (
      <DropdownMenuItem
        disabled={!analyzeId || analyzeMutation.isPending}
        onSelect={handleAnalyze}
      >
        {analyzeMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ScanText className="mr-2 h-4 w-4" />
        )}
        Analyze in Clause Library
      </DropdownMenuItem>
    ) : null;

  return (
    <DocumentActionsMenu
      d={d}
      contractId={contractId}
      canEdit={canEdit}
      navigate={navigate}
      handlePreview={handlePreview}
      handleDownload={handleDownload}
      analyzeItem={analyzeItem}
    />
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
          {onAnalyzed ? (
            <AnalyzeCapableActions
              d={d}
              contractId={contractId}
              contractType={contractType}
              onAnalyzed={onAnalyzed}
              canEdit={canEdit}
              navigate={navigate}
              handlePreview={handlePreview}
              handleDownload={handleDownload}
            />
          ) : (
            <DocumentActionsMenu
              d={d}
              contractId={contractId}
              canEdit={canEdit}
              navigate={navigate}
              handlePreview={handlePreview}
              handleDownload={handleDownload}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
