import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CornerDownRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { formatCurrency } from "@/lib/utils";

// ProposalPriceAction interface based on API schema
interface ProposalPriceAction {
  component: string;
  description?: string;
  quantity: number;
  unitOfmeasurement: string;
  unitPrice: number;
  subtotal: number;
  subItems?: ProposalPriceAction[];
}

// Response interface for the API
interface ProposalPriceBreakdownResponse {
  message: string;
  data: ProposalPriceAction[];
}

interface ReadOnlyProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
}

const ReadOnlyProposalDialog: React.FC<ReadOnlyProposalDialogProps> = ({
  open,
  onOpenChange,
  proposalId,
}) => {
  const toastHandlers = useToastHandler();

  const { data: priceBreakdownData, isLoading, error, isError } = useQuery({
    queryKey: ["proposalPriceBreakdown", proposalId],
    queryFn: async () => {
      const response = await getRequest({ url: `/procurement/evaluations/proposal/${proposalId}` });
      return response.data as ProposalPriceBreakdownResponse;
    },
    enabled: open && !!proposalId,
  });

  // Handle errors with useEffect
  React.useEffect(() => {
    if (isError) {
      toastHandlers.error("Error", (error as any).message || "Failed to load proposal price breakdown");
    }
  }, [error, isError]);

  // Calculate total amount from price breakdown data
  const priceBreakdownItems = Array.isArray(priceBreakdownData?.data) ? priceBreakdownData.data : [];
  const totalAmount = priceBreakdownItems.reduce((sum: number, item: ProposalPriceAction) => {
    const itemTotal = item.subtotal || 0;
    const subItemsTotal = (item.subItems || []).reduce((subSum: number, subItem: ProposalPriceAction) => subSum + (subItem.subtotal || 0), 0);
    return sum + itemTotal + subItemsTotal;
  }, 0);

  const renderPriceItem = (item: ProposalPriceAction, index: number, isSubItem = false) => {
    return (
      <div key={index} className={`space-y-2 ${isSubItem ? 'ml-8' : ''}`}>
        {/* Main Item Row */}
        <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="col-span-1 flex items-center">
            {isSubItem && <CornerDownRight className="text-gray-400 h-4 w-4" />}
            {!isSubItem && <span className="font-medium">{index + 1}</span>}
          </div>
          <div className="col-span-2">
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {item.component}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-600 dark:text-gray-400">
              {item.description || "-"}
            </div>
          </div>
          <div className="col-span-1">
            <div className="text-center text-gray-900 dark:text-gray-100">
              {item.quantity}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-900 dark:text-gray-100">
              {item.unitOfmeasurement}
            </div>
          </div>
          <div className="col-span-1">
            <div className="text-right text-gray-900 dark:text-gray-100">
              {formatCurrency(item.unitPrice, "en-US", "USD")}
            </div>
          </div>
          <div className="col-span-1">
            <div className="text-right font-medium text-gray-900 dark:text-gray-100">
              {formatCurrency(item.subtotal, "en-US", "USD")}
            </div>
          </div>
        </div>

        {/* Sub Items */}
        {item.subItems && item.subItems.length > 0 && (
          <div className="ml-8 space-y-2">
            {item.subItems.map((subItem, subIndex) => (
              renderPriceItem(subItem, subIndex, true)
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Proposal Price Breakdown
          </DialogTitle>
          <DialogDescription>
            View pricing details for this proposal (Read-only)
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading price breakdown...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-600 dark:text-red-400 mb-2">Failed to load price breakdown</div>
                <div className="text-gray-500 text-sm">Please try again later</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Item/Component</div>
                <div className="col-span-2">Description</div>
                <div className="col-span-1">Quantity</div>
                <div className="col-span-2">Unit of Measurement</div>
                <div className="col-span-1">Unit Price</div>
                <div className="col-span-1">Subtotal</div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                {priceBreakdownItems.length > 0 ? (
                  priceBreakdownItems.map((item: ProposalPriceAction, index: number) => renderPriceItem(item, index))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No price breakdown data available
                  </div>
                )}
              </div>

              {/* Total */}
              {priceBreakdownItems.length > 0 && (
                <div className="flex justify-end gap-6 items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(totalAmount, "en-US", "USD")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReadOnlyProposalDialog;