import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";

// API Types
// Make options dynamic to support any added/removed keys from the API
type DocsOptionResponse = Record<string, boolean>;

// Component Props Interface
interface ExportReportSheetProps {
  solicitationId?: string;
  evaluationId?: string;
  children?: React.ReactNode;
}

export const ExportReportSheet: React.FC<ExportReportSheetProps> = ({
  solicitationId,
  evaluationId,
  children,
}) => {
  const [exportFormat, setExportFormat] = useState("pdf");
  const [selectedSections, setSelectedSections] = useState<
    Record<string, boolean>
  >({});
  const [isDownloading, setIsDownloading] = useState(false);
  const toast = useToastHandler();

  // Determine context type
  const isEvaluationContext = !!evaluationId;
  const isSolicitationContext = !!solicitationId;

  // Fetch document options for both solicitation and evaluation contexts
  const {
    data: docsOptionsData,
    isLoading: isLoadingOptions,
    error: optionsError,
  } = useQuery<ApiResponse<DocsOptionResponse>, ApiResponseError>({
    queryKey: ["docs-options", solicitationId, evaluationId],
    queryFn: async () => {
      const contextId = solicitationId || evaluationId;
      return await getRequest({
        url: isEvaluationContext
          ? `/procurement/evaluations/${contextId}/docs-option`
          : `/procurement/solicitations/${contextId}/docs-option`,
      });
    },
    enabled: !!(solicitationId || evaluationId),
  });

  // Update selected sections based on API response
  useEffect(() => {
    const options = docsOptionsData?.data?.data;
    if (options && typeof options === "object") {
      const initialSections: Record<string, boolean> = {};
      Object.entries(options).forEach(([key, value]) => {
        initialSections[key] = Boolean(value);
      });
      setSelectedSections(initialSections);
    }
  }, [docsOptionsData]);

  const handleSectionChange = (section: string, checked: boolean) => {
    setSelectedSections((prev) => ({
      ...prev,
      [section]: checked,
    }));
  };

  // Handle download functionality
  const handleDownload = async () => {
    if (!solicitationId && !evaluationId) {
      toast.error("Download Error", "Missing required context ID");
      return;
    }

    const selectedSectionKeys = Object.keys(selectedSections).filter(
      (key) => selectedSections[key]
    );

    if (selectedSectionKeys.length === 0) {
      toast.error(
        "Download Error",
        "Please select at least one section to export"
      );
      return;
    }

    setIsDownloading(true);

    try {
      if (isSolicitationContext && solicitationId) {
        // Solicitation document download
        const sectionsParam = selectedSectionKeys.join(",");
        const response = await getRequest({
          url: `/procurement/solicitations/${solicitationId}/generate-document?type=${exportFormat}&sections=${sectionsParam}`,
          config: {
            responseType: "blob",
          },
        });

        // Create download link
        const blob = new Blob([response.data], {
          type:
            exportFormat === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `solicitation-report.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          "Download Complete",
          "Solicitation report downloaded successfully"
        );
      } else if (isEvaluationContext && evaluationId) {
        // Evaluation document download
        const sectionsParam = selectedSectionKeys.join(",");
        const response = await getRequest({
          url: `/procurement/evaluations/${evaluationId}/generate-document?type=${exportFormat}&sections=${sectionsParam}`,
          config: {
            responseType: "blob",
          },
        });

        // Create download link
        const blob = new Blob([response.data], {
          type:
            exportFormat === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `evaluation-report.${exportFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(
          "Download Complete",
          "Evaluation report downloaded successfully"
        );
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        "Download Error",
        "Failed to download report. Please try again."
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Get available sections based on API response
  const getAvailableSections = () => {
    const options = docsOptionsData?.data?.data;
    if (!options || typeof options !== "object") return [];

    const friendlyLabels: Record<string, { label: string; description: string }> = {
      details: {
        label: "Solicitation Details",
        description:
          "Overview of the solicitation dates, highest ranking vendor, and NDA + COI forms",
      },
      submissions: {
        label: "Submission",
        description:
          "List of the Vendors (Email Address, Name) that submitted for this Project",
      },
      "score-summary": {
        label: "Scoring Summary",
        description: "Scoring Summary Table (Submission and Criteria Scores)",
      },
      "evaluation-summary": {
        label: "Evaluation Summary",
        description: "Overview of the evaluation process and results",
      },
      "vendor-scores": {
        label: "Vendor Scores",
        description: "Detailed scoring breakdown for each vendor",
      },
      "criteria-breakdown": {
        label: "Criteria Breakdown",
        description: "Analysis of evaluation criteria and scoring methodology",
      },
      "score-comment": {
        label: "Submission Scores Comment",
        description: "Scoring summary comment tables per submission",
      },
      "submission-score": {
        label: "Submission Scores",
        description: "Scoring summary tables per submission",
      },
    };

    return Object.entries(options)
      .filter(([, isAvailable]) => Boolean(isAvailable))
      .map(([key]) => {
        const friendly = friendlyLabels[key];
        const defaultLabel = key
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return {
          key,
          label: friendly?.label ?? defaultLabel,
          description: friendly?.description ?? "Included section",
        };
      });
  };

  const availableSections = getAvailableSections();

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children || (
          <Button size="lg" variant="outline" className="space-x-4 rounded-xl">
            <Share2 className="h-4 w-4 mr-3" />
            Export
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0">
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Export Report
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Loading State */}
          {isLoadingOptions && isSolicitationContext && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-gray-600 dark:text-gray-400">
                  Loading export options...
                </span>
              </div>
            </div>
          )}

          {/* Error State */}
          {optionsError && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-2">
                  Failed to load export options
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Please try again later
                </p>
              </div>
            </div>
          )}

          {/* Export Sections */}
          {!isLoadingOptions &&
            !optionsError &&
            availableSections.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                  Export Report
                </h2>

                <div className="space-y-4">
                  {availableSections.map((section) => (
                    <div
                      key={section.key}
                      className="flex items-start space-x-3"
                    >
                      <Checkbox
                        id={section.key}
                        checked={selectedSections[section.key] || false}
                        onCheckedChange={(checked) =>
                          handleSectionChange(section.key, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={section.key}
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                        >
                          {section.label}
                        </label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* No Context Error */}
          {!solicitationId && !evaluationId && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Export context not available
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Please provide either solicitationId or evaluationId
                </p>
              </div>
            </div>
          )}

          {/* Export Format */}
          {availableSections.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Export Format
              </h3>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Footer */}
        {availableSections.length > 0 && (
          <div className="px-6 py-4">
            <Button
              className="w-full"
              onClick={handleDownload}
              disabled={
                isDownloading ||
                Object.values(selectedSections).every((v) => !v)
              }
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                "Download Report"
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ExportReportSheet;
