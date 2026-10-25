import React from "react";
import type { File as ContractDocument } from "@/types";
import { resolveEnvFileUrl } from "@/config";
import { formatFileSize, getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { DocumentItem } from "./DocumentItem";

type Doc = {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
  icon: React.ReactNode;
  /** Real Mongo ObjectId (when present) — used by the clause analyze action. */
  fileId?: string;
};

type Props = {
  files?: ContractDocument[];
  /** Retained for shape compatibility — no longer used to gate editing.
   *  Edit availability is now driven by `status` (pending_approval only). */
  effectiveDate?: string;
  contractId?: string;
  /** Contract / MSA status. Documents are editable while the record is
   *  still being worked on — `draft` or `pending_approval`; once
   *  `publish`-ed (or any other terminal state) the list is read-only. */
  status?: string;
  /** Which clause endpoint family to hit — `contracts` vs `msa-contracts`. */
  contractType?: "Contract" | "MsaContract";
  /** Passed to each row's analyze action. When provided (only when the Clause
   *  Library tab is visible), rows show the "Analyze in Clause Library" button;
   *  called after a successful analysis to switch to that tab. */
  onNavigateToClauseLibrary?: () => void;
};

const DocumentsList: React.FC<Props> = ({
  files,
  contractId,
  status,
  contractType = "Contract",
  onNavigateToClauseLibrary,
}) => {
  const navigate = useNavigate();
  const { isManager, isProjectManager } = useUserRole();
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<Doc | null>(null);

  // "Edit in Collaboration Tool" is limited to Contract Managers, Procurement
  // (both `isManager`) and Project Managers. Every other role — company admin,
  // approver, vendor, view-only — can preview/download but not edit.
  const canCollaborate = isManager || isProjectManager;

  // Documents are mutable while the contract is still being worked on —
  // `draft` or awaiting approval (`pending_approval`). Anything else —
  // including the most common case `publish` — is read-only. If status is
  // undefined (e.g., a stale caller hasn't passed it yet) we keep the
  // previous lenient default. The role gate above applies on top of this.
  const canEdit = React.useMemo(() => {
    if (!canCollaborate) return false;
    if (status === undefined) return true;
    return status === "draft" || status === "pending_approval";
  }, [status, canCollaborate]);

  const docs = React.useMemo<Doc[]>(() => {
    if (!files?.length) return [];
    return files.map((file, index) => {
      const rawSize = file.size as unknown;
      const size =
        typeof rawSize === "number"
          ? formatFileSize(rawSize)
          : typeof rawSize === "string"
            ? rawSize
            : "-";
      const fileExtension = getFileExtension(file.name || "", file.type || "");

      return {
        id: file._id ?? `${file.name ?? "file"}-${index}`,
        fileId: file._id,
        name: file.name ?? "Untitled",
        icon: getFileIcon(fileExtension),
        type: fileExtension?.toUpperCase() ?? "FILE",
        size,
        url: file.url,
      };
    });
  }, [files]);

  const handlePreview = (doc: Doc) => {
    if (!doc.url) return;
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const handleDownload = (doc: Doc) => {
    if (!doc.url) return;
    // A stored file URL bakes in whatever API host was active when the file
    // was uploaded. Re-home it onto the env-configured base (VITE_API_BASE_URL)
    // so the download always targets the current environment rather than a
    // hardcoded/stale host.
    const a = window.document.createElement("a");
    a.href = resolveEnvFileUrl(doc.url);
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">All Documents</div>
      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No documents available.
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((d) => (
          <DocumentItem
            key={d.id}
            d={d}
            contractId={contractId}
            canEdit={canEdit}
            navigate={navigate}
            handlePreview={handlePreview}
            handleDownload={handleDownload}
            contractType={contractType}
            onAnalyzed={onNavigateToClauseLibrary}
          />
        ))}
      </div>
      )}
      {selectedDoc && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDoc(null);
          }}
          fileUrl={selectedDoc.url as string}
          fileName={selectedDoc.name}
          fileType={getFileExtension(selectedDoc.name, selectedDoc.type)}
        />
      )}
    </div>
  );
};

export default DocumentsList;
