import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronLeft, Download, Printer } from "lucide-react";
import { DataTable } from "@/components/layouts/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useToastHandler } from "@/hooks/useToaster";

// ProposalPriceAction interface based on API schema
interface ProposalPriceAction {
  component: string;
  description?: string;
  quantity: number;
  unitOfMeasurement: string;
  unitPrice: number;
  subtotal: number;
  subItems?: ProposalPriceAction[];
}

// Response interface for the API
interface ProposalPriceBreakdownResponse {
  message: string;
  data: ProposalPriceAction[];
}

interface ProposalPriceBreakdownSheetProps {
  proposalId: string;
  vendorName?: string;
  submissionDate?: string;
  evaluationScore?: string;
  rank?: string;
}

export const ProposalPriceBreakdownSheet = ({
  proposalId,
  vendorName,
  submissionDate,
  evaluationScore,
  rank,
}: ProposalPriceBreakdownSheetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toastHandlers = useToastHandler();

  const {
    data: priceBreakdownData,
    isLoading,
    error,
  } = useQuery<ProposalPriceBreakdownResponse>({
    queryKey: ["proposal-price-breakdown", proposalId],
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/proposal/${proposalId}`,
      });
      return response.data as ProposalPriceBreakdownResponse;
    },
    enabled: isOpen && !!proposalId,
  });

  // Export price breakdown mutation for download
  const exportPriceBreakdownMutation = useMutation<
    Blob,
    Error,
    { type: "pdf" | "docx" }
  >({
    mutationFn: async ({ type }) => {
      const response = await getRequest({
        url: `/procurement/evaluations/proposal/${proposalId}/export?type=${type}`,
        config: { responseType: "blob" },
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `price-breakdown-${proposalId}.${variables.type}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toastHandlers.success(
        "Download Successful",
        `Price breakdown downloaded as ${variables.type.toUpperCase()} successfully`
      );
    },
    onError: (error) => {
      toastHandlers.error(
        "Download Failed",
        error.message || "An error occurred during download"
      );
    },
  });

  // Handle download
  const handleDownload = () => {
    exportPriceBreakdownMutation.mutate({ type: "pdf" });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Calculate total amount from price breakdown data
  const priceBreakdownItems = Array.isArray(priceBreakdownData?.data)
    ? priceBreakdownData.data
    : [];
  const totalAmount = priceBreakdownItems.reduce(
    (sum, item) => sum + (item.subtotal || 0),
    0
  );

  // Flatten price breakdown items for table display
  const flattenPriceItems = (
    items: ProposalPriceAction[],
    level = 0
  ): (ProposalPriceAction & { level: number; itemNumber: string })[] => {
    const result: (ProposalPriceAction & {
      level: number;
      itemNumber: string;
    })[] = [];

    items.forEach((item, index) => {
      const itemNumber =
        level === 0
          ? (index + 1).toString()
          : `${Math.floor(index / 10) + 1}.${(index % 10) + 1}`;
      result.push({ ...item, level, itemNumber });

      if (item.subItems && item.subItems.length > 0) {
        result.push(...flattenPriceItems(item.subItems, level + 1));
      }
    });

    return result;
  };

  const flattenedItems = flattenPriceItems(priceBreakdownItems);

  // Define table columns for price breakdown
  const columns: ColumnDef<
    ProposalPriceAction & { level: number; itemNumber: string }
  >[] = [
    {
      accessorKey: "itemNumber",
      header: "#",
      cell: ({ row }) => (
        <div className="font-medium text-center w-8">
          {row.original.itemNumber}
        </div>
      ),
    },
    {
      accessorKey: "component",
      header: "Line Item / Component",
      cell: ({ row }) => (
        <div className={`font-medium ${row.original.level > 0 ? "pl-6" : ""}`}>
          {row.original.component}
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description (Optional)",
      cell: ({ row }) => (
        <div className="text-gray-600 dark:text-gray-400">
          {row.original.description || "-"}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div className="text-center">{row.original.quantity}</div>
      ),
    },
    {
      accessorKey: "unitPrice",
      header: "Unit Price",
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.unitPrice.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </div>
      ),
    },
    {
      accessorKey: "subtotal",
      header: "Total",
      cell: ({ row }) => (
        <div className="text-right font-medium">
          {row.original.subtotal.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </div>
      ),
    },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-0 h-auto font-normal"
        >
          View Breakdown
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-4xl p-0 overflow-y-auto ">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-slate-200" />
            <h2 className="text-lg font-medium text-gray-900 dark:text-slate-200">
              Price Breakdown
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Title and Export */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-200">
              {vendorName || "Zenith Solutions"} Price Breakdown
            </h1>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Company and Submission Info */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Submitted by
              </p>
              <p className="text-base font-medium text-gray-900 dark:text-slate-200">
                {vendorName || "Zenith Solutions"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Submission Date
              </p>
              <p className="text-base text-gray-900 dark:text-slate-200">
                {submissionDate || "April 30, 2025"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Evaluation Score
              </p>
              <p className="text-base text-gray-900 dark:text-slate-200">
                {evaluationScore ? `${Number(evaluationScore).toFixed(0)}%` : "0%"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                Rank
              </p>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                  {rank || "Best Price"}
                </span>
              </div>
            </div>
          </div>

          {/* Price Breakdown Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">
                Loading price breakdown data...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">
                Failed to load price breakdown data
              </div>
            </div>
          ) : (
            <>
              <DataTable
                data={flattenedItems}
                columns={columns}
                classNames={{
                  container: "border rounded-lg overflow-hidden",
                  table: "border-separate border-spacing-0",
                  tHeader: "bg-gray-50 dark:bg-gray-800",
                  tHead:
                    "text-sm font-medium text-gray-700 dark:text-gray-300 px-4 py-3 text-left border-b",
                  tRow: "bg-white dark:bg-gray-900 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800",
                  tCell: "px-4 py-3 text-sm border-r last:border-r-0",
                }}
                options={{
                  disablePagination: true,
                  disableSelection: true,
                  isLoading: false,
                  totalCounts: flattenedItems.length,
                  manualPagination: false,
                  setPagination: () => {},
                  pagination: { pageIndex: 0, pageSize: 100 },
                }}
                emptyPlaceholder={
                  <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500 dark:text-slate-200">
                      No price breakdown data available
                    </div>
                  </div>
                }
              />

              {/* Total Row */}
              <div className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center px-4 py-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-slate-200">
                    Total
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-slate-200">
                    {totalAmount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            <Button
              variant="outline"
              className="px-6 flex items-center gap-2"
              onClick={handleDownload}
              disabled={exportPriceBreakdownMutation.isPending}
            >
              <Download className="h-4 w-4" />
              {exportPriceBreakdownMutation.isPending
                ? "Downloading..."
                : "Download"}
            </Button>
            <Button
              className="px-6 bg-blue-900 hover:bg-blue-800 flex items-center gap-2"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
