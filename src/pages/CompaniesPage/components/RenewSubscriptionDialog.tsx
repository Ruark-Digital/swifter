import { useState } from "react";
import { addDays, isValid, parseISO } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { postRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { formatDateTZ } from "@/lib/utils";

// POST /subscriptions/{id}/renew requires durationInDays with a minimum of 30
// (per docs.json, tag SuperAdmin). Radix Select needs string values, so keep
// these as strings and Number() them on submit.
const DURATION_OPTIONS = [
  { label: "30 days (1 month)", value: "30" },
  { label: "90 days (3 months)", value: "90" },
  { label: "180 days (6 months)", value: "180" },
  { label: "365 days (1 year)", value: "365" },
];

interface RenewSubscriptionDialogProps {
  subscriptionId: string;
  /** Route company id, used to refresh the company detail after renewal. */
  companyId?: string;
  /** Current subscription expiry (ISO string), for the projected-expiry preview. */
  currentExpiry?: string;
  /** Trigger. When omitted, drive the dialog via the controlled `open` prop. */
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const RenewSubscriptionDialog = ({
  subscriptionId,
  companyId,
  currentExpiry,
  children,
  open: controlledOpen,
  onOpenChange,
}: RenewSubscriptionDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  const [durationDays, setDurationDays] = useState("30");
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { mutate: renew, isPending } = useMutation<
    ApiResponse<unknown>,
    ApiResponseError,
    { id: string; durationInDays: number }
  >({
    mutationFn: async ({ id, durationInDays }) =>
      await postRequest({
        url: `/subscriptions/${id}/renew`,
        payload: { durationInDays },
      }),
    onSuccess: () => {
      toast.success(
        "Subscription Renewed",
        "Subscription renewed successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setOpen(false);
      setDurationDays("30");
    },
    onError: (error) => {
      toast.error(
        "Renewal Failed",
        error?.response?.data?.message ?? "Failed to renew subscription",
      );
    },
  });

  // Renewal extends from whichever is later — today or the current expiry — so
  // the preview mirrors typical renewal semantics. The backend is authoritative;
  // this is a projection to orient the admin.
  const parsedExpiry = currentExpiry ? parseISO(currentExpiry) : null;
  const base =
    parsedExpiry && isValid(parsedExpiry) && parsedExpiry > new Date()
      ? parsedExpiry
      : new Date();
  const projectedExpiry = addDays(base, Number(durationDays));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renew Subscription</DialogTitle>
          <DialogDescription>
            Extend this subscription's expiry date. Renewal reactivates the
            subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Renewal period
            </label>
            <Select value={durationDays} onValueChange={setDurationDays}>
              <SelectTrigger data-testid="renewal-duration-select">
                <SelectValue placeholder="Select a renewal period" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Projected new expiry:{" "}
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {formatDateTZ(projectedExpiry, "MMMM d, yyyy")}
            </span>
          </p>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() =>
                renew({
                  id: subscriptionId,
                  durationInDays: Number(durationDays),
                })
              }
              isLoading={isPending}
              disabled={isPending}
              className="text-white"
            >
              Renew Subscription
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RenewSubscriptionDialog;
