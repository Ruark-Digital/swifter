import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useFieldArray,
  ForgeControl,
  Forger,
  useForge,
  Forge,
} from "@/lib/forge";

import { Plus, Trash2, CornerDownRight } from "lucide-react";
import { usePersist } from "@/lib/forge/usePersist/usePersist";
import { UseFormSetValue, UseFormGetValues } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { useToastHandler } from "@/hooks/useToaster";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

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

// Form schema for amend proposal
const amendProposalSchema = yup.object().shape({
  reason: yup.string().required("Reason for amendment is required"),
  total: yup
    .number()
    .required("Total amount is required")
    .min(0, "Total must be positive"),
  priceAction: yup
    .array()
    .of(
      yup.object().shape({
        component: yup.string().required("Component is required"),
        description: yup.string().required("Description is required"),
        quantity: yup
          .number()
          .required("Quantity is required")
          .min(0, "Quantity must be positive")
          .integer(),
        unitOfmeasurement: yup
          .string()
          .required("Unit of measurement is required"),
        unitPrice: yup
          .number()
          .required("Unit price is required")
          .min(0, "Unit price must be positive"),
        subtotal: yup.number().optional().min(0, "Subtotal must be positive"),
        subItems: yup
          .array()
          .of(
            yup.object().shape({
              component: yup.string().required("Sub-component is required"),
              description: yup.string().required("Sub-description is required"),
              quantity: yup
                .number()
                .required("Sub-quantity is required")
                .min(0, "Sub-quantity must be positive"),
              unitOfmeasurement: yup
                .string()
                .required("Sub-unit of measurement is required"),
              unitPrice: yup
                .number()
                .required("Sub-unit price is required")
                .min(0, "Sub-unit price must be positive"),
              subtotal: yup
                .number()
                .required("Sub-subtotal is required")
                .min(0, "Sub-subtotal must be positive"),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

export type AmendProposalFormValues = yup.InferType<typeof amendProposalSchema>;

// Function to calculate total amount
const calculateTotal = (data: { priceAction: any[] }) => {
  if (!data.priceAction || !Array.isArray(data.priceAction)) return 0;

  return data.priceAction.reduce((total: number, item: any) => {
    const mainSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const subItemsTotal = (item.subItems || []).reduce(
      (subSum: number, subItem: any) => {
        return subSum + (subItem?.quantity || 0) * (subItem?.unitPrice || 0);
      },
      0
    );
    return total + mainSubtotal + subItemsTotal;
  }, 0);
};

interface AmendProposalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
}

const AmendProposalDialog: React.FC<AmendProposalDialogProps> = ({
  open,
  onOpenChange,
  proposalId,
}) => {
  const [totalAmount, setTotalAmount] = useState("0.00");
  const toastHandlers = useToastHandler();

  // Initialize form with forge
  const forge = useForge<AmendProposalFormValues>({
    resolver: yupResolver(amendProposalSchema),
    defaultValues: {
      reason: "",
      total: 0,
      priceAction: [],
    },
  });

  const { control, setValue, getValues, reset } = forge;

  // Fetch existing proposal price breakdown data
  const { data: priceBreakdownData, isLoading } = useQuery<
    ApiResponse<ProposalPriceBreakdownResponse>,
    ApiResponseError
  >({
    queryKey: ["proposal-price-breakdown", proposalId],
    queryFn: async () => {
      const response = await getRequest({
        url: `/procurement/evaluations/proposal/${proposalId}`,
      });
      return response;
    },
    enabled: open && !!proposalId,
  });
  const priceAction = priceBreakdownData?.data?.data;

  // Initialize form with existing data when loaded
  useEffect(() => {
    if (priceAction && Array.isArray(priceAction)) {
      const priceActionData = priceAction.map(
        (action: ProposalPriceAction) => ({
          component: action.component || "",
          description: action.description || "",
          quantity: action.quantity || 0,
          unitOfmeasurement: action.unitOfMeasurement || "",
          unitPrice: action.unitPrice || 0,
          subtotal:
            action.subtotal || (action.quantity || 0) * (action.unitPrice || 0),
          subItems: action.subItems || [],
        })
      );

      const total = calculateTotal({ priceAction: priceActionData });

      reset({
        reason: "",
        total: total,
        priceAction: priceActionData,
      });

      setTotalAmount(total.toFixed(2));
    }
  }, [priceAction, reset]);

  // Use persist to auto-calculate totals
  usePersist({
    control,
    handler: (data, state) => {
      if (data && data.priceAction && state.type === "change") {
        // Recalculate main item subtotals
        const updatedPriceAction = data.priceAction.map((item: any) => ({
          ...item,
          subtotal:
            (parseFloat(item.quantity) || 0) *
            (parseFloat(item.unitPrice) || 0),
        }));

        // Update form with recalculated subtotals
        setValue("priceAction", updatedPriceAction);

        // Calculate and set total
        const total = calculateTotal({ priceAction: updatedPriceAction });
        setTotalAmount(total.toFixed(2));
        setValue("total", total);
      }
    },
  });

  // Amendment mutation
  const { mutateAsync: amendProposal, isPending: isAmending } = useMutation<
    ApiResponse<any>,
    ApiResponseError,
    AmendProposalFormValues
  >({
    mutationFn: async (amendData) => {
      // Transform price action data to match API expectations
      const payload = {
        reason: amendData.reason,
        priceAction: amendData.priceAction?.map((item) => ({
          ...item,
          quantity:
            typeof item.quantity === "string"
              ? parseInt(item.quantity, 10)
              : item.quantity,
          unitPrice:
            typeof item.unitPrice === "string"
              ? parseFloat(item.unitPrice)
              : item.unitPrice,
          subtotal:
            ((typeof item.quantity === "string"
              ? parseFloat(item.quantity)
              : item.quantity) || 0) *
            ((typeof item.unitPrice === "string"
              ? parseFloat(item.unitPrice)
              : item.unitPrice) || 0),
          subItems: item.subItems?.map((sub) => ({
            ...sub,
            quantity:
              typeof sub.quantity === "string"
                ? parseInt(sub.quantity, 10)
                : sub.quantity,
            unitPrice:
              typeof sub.unitPrice === "string"
                ? parseFloat(sub.unitPrice)
                : sub.unitPrice,
            subtotal:
              ((typeof sub.quantity === "string"
                ? parseFloat(sub.quantity)
                : sub.quantity) || 0) *
              ((typeof sub.unitPrice === "string"
                ? parseFloat(sub.unitPrice)
                : sub.unitPrice) || 0),
          })),
        })),
        total: amendData.total,
      };

      return await putRequest({
        url: `/procurement/solicitations/proposals/${proposalId}/pricing-submissions`,
        payload: payload,
      });
    },
    onSuccess: () => {
      toastHandlers.success("Success", "Proposal pricing amended successfully");
      onOpenChange(false);
      reset();
    },
    onError: (error: ApiResponseError) => {
      toastHandlers.error(
        "Error",
        error.message || "Failed to amend proposal pricing"
      );
    },
  });

  const handleSubmit = async () => {
    const formData = getValues();
    await amendProposal(formData);
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Amend Proposal Pricing</DialogTitle>
            <DialogDescription>
              Loading existing proposal data...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-lg font-semibold">
            Amend Submission
          </DialogTitle>
        </DialogHeader>

        <Forge control={control} onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* File to Amend */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                File to Amend
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Pricing
              </div>
            </div>

            {/* Pricing Table */}
            <PricingTable
              {...{ control, totalAmount, setTotalAmount, setValue, getValues }}
            />

            {/* Reason / Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason / Note *
              </label>
              <Forger
                name="reason"
                placeholder="Enter reason for amendment..."
                component={Textarea}
                control={control}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-2 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAmending}
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isAmending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAmending ? "Amending..." : "Amend"}
            </Button>
          </DialogFooter>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default AmendProposalDialog;

interface PricingTableProps {
  control: ForgeControl<AmendProposalFormValues>;
  totalAmount: string;
  setTotalAmount: (amount: string) => void;
  setValue: UseFormSetValue<AmendProposalFormValues>;
  getValues: UseFormGetValues<AmendProposalFormValues>;
}

const PricingTable: React.FC<PricingTableProps> = ({
  control,
  totalAmount,
  setTotalAmount,
  setValue,
  getValues,
}) => {
  // Use field array for price actions
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "priceAction",
    inputProps: {},
  });

  // Function to calculate subtotal for a specific item
  const calculateItemSubtotal = (index: number) => {
    const watchedPriceActions = getValues()?.priceAction;

    const quantity = watchedPriceActions?.[index]?.quantity || 0;
    const unitPrice = watchedPriceActions?.[index]?.unitPrice || 0;
    const subtotal = quantity * unitPrice;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(subtotal);
  };

  const addItem = () => {
    append({
      component: "",
      description: "",
      quantity: 0,
      unitOfmeasurement: "",
      unitPrice: 0,
      subtotal: 0,
      subItems: [],
    });
  };

  const removeItem = (index: number) => {
    remove(index);

    // Recalculate total after removal
    const updatedItems = getValues().priceAction || [];
    const total = calculateTotal({ priceAction: updatedItems });
    setTotalAmount(total.toFixed(2));
    setValue("total", total);
  };

  const addSubItem = (itemIndex: number) => {
    const currentItems = getValues().priceAction || [];
    const currentItem = currentItems[itemIndex];

    if (currentItem) {
      const updatedItem = {
        ...currentItem,
        subItems: [
          ...(currentItem.subItems || []),
          {
            component: "",
            description: "",
            quantity: 0,
            unitOfmeasurement: "",
            unitPrice: 0,
            subtotal: 0,
          },
        ],
      };
      update(itemIndex, updatedItem);
    }
  };

  const removeSubItem = (itemIndex: number, subItemIndex: number) => {
    const currentItems = getValues().priceAction || [];
    const updatedItems = [...currentItems];

    if (
      updatedItems[itemIndex]?.subItems &&
      Array.isArray(updatedItems[itemIndex].subItems) &&
      updatedItems[itemIndex].subItems.length > subItemIndex
    ) {
      // Remove the sub-item from the array
      updatedItems[itemIndex].subItems.splice(subItemIndex, 1);

      // Recalculate the main item's subtotal
      const mainSubtotal =
        (updatedItems[itemIndex].quantity || 0) *
        (updatedItems[itemIndex].unitPrice || 0);
      const subItemsTotal = updatedItems[itemIndex].subItems.reduce(
        (sum: number, subItem: any) => {
          return sum + (subItem?.quantity || 0) * (subItem?.unitPrice || 0);
        },
        0
      );
      updatedItems[itemIndex].subtotal = mainSubtotal + subItemsTotal;

      // Update the entire priceAction array
      setValue("priceAction", updatedItems);

      // Unregister the removed sub-item fields
      control.unregister(
        `priceAction.${itemIndex}.subItems.${subItemIndex}.component`
      );
      control.unregister(
        `priceAction.${itemIndex}.subItems.${subItemIndex}.description`
      );
      control.unregister(
        `priceAction.${itemIndex}.subItems.${subItemIndex}.quantity`
      );
      control.unregister(
        `priceAction.${itemIndex}.subItems.${subItemIndex}.unitOfmeasurement`
      );
      control.unregister(
        `priceAction.${itemIndex}.subItems.${subItemIndex}.unitPrice`
      );
      control.unregister(
        `priceAction.${itemIndex}.subItems.${subItemIndex}.subtotal`
      );

      // Recalculate total
      const total = calculateTotal({ priceAction: updatedItems });
      setTotalAmount(total.toFixed(2));
      setValue("total", total);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 pb-2 border-b border-gray-200 dark:border-gray-600">
          <div className="col-span-1">#</div>
          <div className="col-span-2">Item/Component</div>
          <div className="col-span-2">Description</div>
          <div className="col-span-1">Quantity</div>
          <div className="col-span-2">Unit of Measurement</div>
          <div className="col-span-2">Unit Price</div>
          <div className="col-span-1">Total</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Price Action Items */}
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-2">
            <div
              key={field.id}
              className="grid grid-cols-12 gap-3 items-center py-2"
            >
              <div className="col-span-1">
                <span className="text-sm font-medium">{index + 1}</span>
              </div>
              <div className="col-span-2">
                <Forger
                  name={`priceAction.${index}.component`}
                  placeholder="Item 2"
                  component={Input}
                  className="h-9 text-sm"
                />
              </div>
              <div className="col-span-2">
                <Forger
                  name={`priceAction.${index}.description`}
                  placeholder="xyz Item"
                  component={Input}
                  className="h-9 text-sm"
                />
              </div>
              <div className="col-span-1">
                <Forger
                  name={`priceAction.${index}.quantity`}
                  placeholder="Enter Value"
                  component={Input}
                  className="h-9 text-sm"
                  type="number"
                />
              </div>
              <div className="col-span-2">
                <Forger
                  name={`priceAction.${index}.unitOfmeasurement`}
                  placeholder="Enter Value"
                  component={Input}
                  className="h-9 text-sm"
                />
              </div>
              <div className="col-span-2">
                <Forger
                  name={`priceAction.${index}.unitPrice`}
                  placeholder="Enter Value"
                  component={Input}
                  className="h-9 text-sm"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="col-span-1">
                <div className="h-9 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center">
                  {calculateItemSubtotal(index)}
                </div>
              </div>
              <div className="col-span-1 flex justify-center space-x-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addSubItem(index)}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {(field as any).subItems && (field as any).subItems!.length > 0 && (
              <SubPriceTable
                subItems={(field as any).subItems}
                index={index}
                control={control}
                removeSubItem={removeSubItem}
              />
            )}
          </div>
        ))}

        {/* Add More Button */}
        <div className="flex justify-start pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addItem}
            className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add More
          </Button>
        </div>

        {/* Total */}
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(parseFloat(totalAmount))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// SubPriceTable component for rendering sub-items
interface SubPriceTableProps {
  subItems: any[];
  index: number;
  control: ForgeControl<AmendProposalFormValues>;
  removeSubItem: (itemIndex: number, subItemIndex: number) => void;
}

const SubPriceTable: React.FC<SubPriceTableProps> = ({
  subItems,
  index,
  control,
  removeSubItem,
}) => {
  return (
    <div className="ml-8 space-y-2">
      {subItems!.map((subItem: any, subIndex: any) => (
        <div key={subIndex} className="grid grid-cols-12 gap-4 py-2">
          <div className="col-span-1 flex items-center">
            <CornerDownRight className="text-gray-400" />
            {/* <div className="w-4 h-px bg-gray-400 mr-2"></div> */}
          </div>
          <div className="col-span-2">
            <Forger
              name={`priceAction.${index}.subItems.${subIndex}.component`}
              component={Input}
              placeholder="Item/Component"
              className="h-8"
              control={control as any}
            />
          </div>
          <div className="col-span-2">
            <Forger
              name={`priceAction.${index}.subItems.${subIndex}.description`}
              placeholder="Description"
              component={Input}
              className="h-8"
              control={control as any}
            />
          </div>
          <div className="col-span-1">
            <Forger
              name={`priceAction.${index}.subItems.${subIndex}.quantity`}
              placeholder="Quantity"
              component={Input}
              className="h-8"
              type="number"
              control={control as any}
            />
          </div>
          <div className="col-span-2">
            <Forger
              name={`priceAction.${index}.subItems.${subIndex}.unitOfmeasurement`}
              placeholder="Unit of Measurement"
              component={Input}
              className="h-8"
              control={control as any}
            />
          </div>
          <div className="col-span-1">
            <Forger
              name={`priceAction.${index}.subItems.${subIndex}.unitPrice`}
              placeholder="Unit Price"
              component={Input}
              className="h-8"
              type="number"
              step="0.01"
              control={control as any}
            />
          </div>
          <div className="col-span-1">
            <div className="h-8 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm flex items-center">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format((subItem?.quantity || 0) * (subItem?.unitPrice || 0))}
            </div>
          </div>
          <div className="col-span-1 flex items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeSubItem(index, subIndex)}
              className="h-8 px-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
