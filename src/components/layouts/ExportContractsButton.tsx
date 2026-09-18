import React from "react";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";

type ExportFormat = "pdf" | "docx";

type ExportContractsButtonProps = {
  /** BE export endpoint, e.g. "/contract/manager/contracts/export" (all
   *  contracts incl. MSA) or "/contract/manager/msa-contracts/export". The
   *  endpoint streams a single PDF/DOCX document of every matching contract. */
  endpoint: string;
  /** Active list status filter, passed through to scope the export. "all" or
   *  empty exports everything the endpoint covers. */
  status?: string;
  /** Download filename base (extension is appended per chosen format). */
  filenameBase: string;
  disabled?: boolean;
};

const MIME_BY_FORMAT: Record<ExportFormat, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/**
 * "Export" control for a contracts/MSA list. The backend export endpoints
 * return the full set of matching contracts as a single PDF or DOCX document
 * (not just the current page), so this hits that endpoint with the active
 * status filter and downloads the returned binary. QA #32.
 */
export const ExportContractsButton: React.FC<ExportContractsButtonProps> = ({
  endpoint,
  status,
  filenameBase,
  disabled,
}) => {
  const [downloading, setDownloading] = React.useState<ExportFormat | null>(null);
  const toast = useToastHandler();

  const handleExport = async (exportType: ExportFormat) => {
    if (downloading) return;
    setDownloading(exportType);
    try {
      const params = new URLSearchParams({ exportType });
      if (status && status !== "all") params.append("status", status);

      const response = await getRequest({
        url: `${endpoint}?${params.toString()}`,
        config: { responseType: "blob" },
      });

      const blob = new Blob([(response as { data: BlobPart }).data], {
        type: MIME_BY_FORMAT[exportType],
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filenameBase}.${exportType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Export", `Downloaded as ${exportType.toUpperCase()}`);
    } catch (error) {
      toast.error("Export failed", error as never);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded-xl"
          disabled={disabled || downloading !== null}
        >
          {downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("docx")}>
          Export as DOCX
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportContractsButton;
