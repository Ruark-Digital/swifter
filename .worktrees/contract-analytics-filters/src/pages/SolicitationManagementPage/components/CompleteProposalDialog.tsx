import React, { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFieldArray, ForgeControl, Forger } from "@/lib/forge";
import { TextInput } from "../../../components/layouts/FormInputs/TextInput";
import { CornerDownRight, Plus, Trash2 } from "lucide-react";
import ProposalItemRow from "./ProposalItemRow";
import { FormValues } from "./SubmitProposalPage";
import { useEffect, useMemo, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";
import { UseFormSetValue, UseFormGetValues, useWatch } from "react-hook-form";

interface CompleteProposalDialogProps {
  open: boolean;
  id: string | null;
  onOpenChange: (open: boolean) => void;
  control: ForgeControl<FormValues>;
  reset?: () => void;
  setValue: UseFormSetValue<FormValues>;
  getValue: UseFormGetValues<FormValues>;
  shouldUnregister?: boolean;
  onComplete?: (documentId: string | null) => void;
}

interface PriceSubItem {
  component: string;
  description: string;
  quantity: number;
  unitOfmeasurement: string;
  unitPrice: number;
  subtotal: number;
}

interface PriceActionItem {
  component: string;
  description: string;
  quantity: number;
  unitOfmeasurement: string;
  unitPrice: number;
  subtotal: number;
  subItems?: PriceSubItem[];
}

const CompleteProposalDialog: React.FC<CompleteProposalDialogProps> = ({
  id,
  open,
  onOpenChange,
  control,
  setValue,
  getValue,
  shouldUnregister = false,
  onComplete,
}) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "priceAction",
    inputProps: {},
    shouldUnregister,
  });

  const watchedPriceAction = useWatch({
    control: control as any,
    name: "priceAction",
  }) as PriceActionItem[] | undefined;

  // Calculate subtotal for an item (including its sub-items)
  const calculateItemSubtotal = useCallback((item: PriceActionItem) => {
    const mainSubtotal = (item?.quantity || 0) * (item?.unitPrice || 0);
    const subItemsTotal = (item?.subItems || []).reduce(
      (sum: number, subItem: PriceSubItem) => {
        return sum + (subItem.quantity || 0) * (subItem.unitPrice || 0);
      },
      0
    );
    return mainSubtotal + subItemsTotal;
  }, []);

  const totalAmount = useMemo(() => {
    if (!watchedPriceAction || !Array.isArray(watchedPriceAction)) return 0;
    return watchedPriceAction.reduce((total: number, item: PriceActionItem) => {
      return total + calculateItemSubtotal(item);
    }, 0);
  }, [watchedPriceAction, calculateItemSubtotal]);

  useEffect(() => {
    if (open) {
      const pa = (getValue().priceAction as PriceActionItem[] | undefined);
      if (pa === undefined) {
        setValue("priceAction", [], { shouldDirty: false, shouldValidate: false });
      }
    }

    const items = watchedPriceAction || [];

    items.forEach((item, index) => {
      const itemSubtotal = calculateItemSubtotal(item as PriceActionItem);
      if ((item as PriceActionItem)?.subtotal !== itemSubtotal) {
        setValue(`priceAction.${index}.subtotal`, itemSubtotal as number, {
          shouldDirty: false,
          shouldValidate: false,
        });
      }
      ((item as PriceActionItem)?.subItems || []).forEach((subItem, subIndex) => {
        const subSubtotal = (subItem?.quantity || 0) * (subItem?.unitPrice || 0);
        if (subItem?.subtotal !== subSubtotal) {
          setValue(`priceAction.${index}.subItems.${subIndex}.subtotal`, subSubtotal as number, {
            shouldDirty: false,
            shouldValidate: false,
          });
        }
      });
    });

    setValue("total", totalAmount as number, { shouldDirty: false, shouldValidate: false });
  }, [open, watchedPriceAction, totalAmount, setValue, calculateItemSubtotal, getValue]);

  const handleComplete = useCallback(() => {
    setValue("document", [
      ...(getValue().document ?? []),
      { requiredDocumentId: id ?? "", files: [] },
    ]);
    onComplete?.(id);
    onOpenChange(false);
  }, [getValue, id, onComplete, onOpenChange, setValue]);

  const addItem = useCallback(() => {
    append({
      component: "",
      description: "",
      quantity: 0,
      unitOfmeasurement: "",
      unitPrice: 0,
      subtotal: 0,
      subItems: [],
    });
  }, [append]);

  const unregisterItemFields = useCallback(
    (itemIndex: number) => {
      const items = (getValue().priceAction || []) as PriceActionItem[];
      const subLen = (items[itemIndex]?.subItems || []).length;
      control.unregister(`priceAction.${itemIndex}.component`);
      control.unregister(`priceAction.${itemIndex}.description`);
      control.unregister(`priceAction.${itemIndex}.quantity`);
      control.unregister(`priceAction.${itemIndex}.unitOfmeasurement`);
      control.unregister(`priceAction.${itemIndex}.unitPrice`);
      control.unregister(`priceAction.${itemIndex}.subtotal`);
      for (let s = 0; s < subLen; s++) {
        control.unregister(`priceAction.${itemIndex}.subItems.${s}.component`);
        control.unregister(`priceAction.${itemIndex}.subItems.${s}.description`);
        control.unregister(`priceAction.${itemIndex}.subItems.${s}.quantity`);
        control.unregister(
          `priceAction.${itemIndex}.subItems.${s}.unitOfmeasurement`
        );
        control.unregister(`priceAction.${itemIndex}.subItems.${s}.unitPrice`);
        control.unregister(`priceAction.${itemIndex}.subItems.${s}.subtotal`);
      }
    },
    [control, getValue]
  );

  const removeItem = useCallback(
    (index: number) => {
      unregisterItemFields(index);
      remove(index);
    },
    [remove, unregisterItemFields]
  );

  const addSubItem = useCallback((itemIndex: number) => {
    const currentItem = fields[itemIndex] as unknown as PriceActionItem;
    if (currentItem) {
      const updatedItem: PriceActionItem = {
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
      update(itemIndex, updatedItem as any);
    }
  }, [fields, update]);

  const unregisterSubItemFields = useCallback(
    (itemIndex: number, subIndex: number) => {
      control.unregister(`priceAction.${itemIndex}.subItems.${subIndex}.component`);
      control.unregister(`priceAction.${itemIndex}.subItems.${subIndex}.description`);
      control.unregister(`priceAction.${itemIndex}.subItems.${subIndex}.quantity`);
      control.unregister(
        `priceAction.${itemIndex}.subItems.${subIndex}.unitOfmeasurement`
      );
      control.unregister(`priceAction.${itemIndex}.subItems.${subIndex}.unitPrice`);
      control.unregister(`priceAction.${itemIndex}.subItems.${subIndex}.subtotal`);
    },
    [control]
  );

  const removeSubItem = useCallback(
    (itemIndex: number, subItemIndex: number) => {
      const currentItems = (getValue().priceAction || []) as PriceActionItem[];
      const currentItem = currentItems[itemIndex];
      if (!currentItem) return;
      unregisterSubItemFields(itemIndex, subItemIndex);
      const nextSubItems = (currentItem.subItems || []).filter((_, i) => i !== subItemIndex);
      const updatedItem: PriceActionItem = {
        ...currentItem,
        subItems: nextSubItems,
      };
      update(itemIndex, updatedItem as any);
    },
    [getValue, update, unregisterSubItemFields]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Complete Proposal
          </DialogTitle>
          <DialogDescription>
            Add pricing details for your proposal items
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">
              <div className="col-span-1">#</div>
              <div className="col-span-2">Item/Component</div>
              <div className="col-span-2">Description</div>
              <div className="col-span-1">Quantity</div>
              <div className="col-span-2">Unit of Measurement</div>
              <div className="col-span-1">Unit Price</div>
              <div className="col-span-1">Subtotal</div>
              <div className="">Actions</div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-2">
                  {/* Main Item Row */}
                  <ProposalItemRow
                    {...{ control }}
                    index={index}
                    onAddSubItem={addSubItem}
                    onRemoveItem={removeItem}
                  />

                  {/* Sub Items */}
                  {(field as any).subItems &&
                    (field as any).subItems!.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {(field as any).subItems!.map(
                          (subItem: any, subIndex: any) => (
                            <div
                              key={subIndex}
                              className="grid grid-cols-12 gap-4 py-2"
                            >
                              <div className="col-span-1 flex items-center">
                                <CornerDownRight className="text-gray-400" />
                                {/* <div className="w-4 h-px bg-gray-400 mr-2"></div> */}
                              </div>
                              <div className="col-span-2">
                                <Forger
                                  name={`priceAction.${index}.subItems.${subIndex}.component`}
                                  component={TextInput}
                                  placeholder="Item/Component"
                                  className="h-8"
                                  control={control as any}
                                />
                              </div>
                              <div className="col-span-2">
                                <Forger
                                  name={`priceAction.${index}.subItems.${subIndex}.description`}
                                  value={subItem.description}
                                  placeholder="Description"
                                  component={TextInput}
                                  className="h-8"
                                  control={control as any}
                                />
                              </div>
                              <div className="col-span-1">
                                <Forger
                                  name={`priceAction.${index}.subItems.${subIndex}.quantity`}
                                  placeholder="Quantity"
                                  component={TextInput}
                                  type="number"
                                  className="h-8"
                                  control={control as any}
                                  transform={{
                                    input: (value: any) => {
                                      if (typeof value === "number") {
                                        return value.toString();
                                      }
                                      return value?.toString() || "";
                                    },
                                    output: (value: string) => {
                                      if (typeof value !== "string") {
                                        return 0;
                                      }
                                      const parsed = parseFloat(value);
                                      return isNaN(parsed) ? 0 : parsed;
                                    },
                                  }}
                                />
                              </div>
                              <div className="col-span-2">
                                <Forger
                                  name={`priceAction.${index}.subItems.${subIndex}.unitOfmeasurement`}
                                  placeholder="Unit of Measurement"
                                  component={TextInput}
                                  className="h-8"
                                  control={control as any}
                                />
                              </div>
                              <div className="col-span-1">
                                <Forger
                                  name={`priceAction.${index}.subItems.${subIndex}.unitPrice`}
                                  placeholder="Unit Price"
                                  component={TextInput}
                                  className="h-8"
                                  type="number"
                                  control={control as any}
                                  transform={{
                                    input: (value: any) => {
                                      if (typeof value === "number") {
                                        return value.toString();
                                      }
                                      return value?.toString() || "";
                                    },
                                    output: (value: string) => {
                                      if (typeof value !== "string") {
                                        return 0;
                                      }
                                      const parsed = parseFloat(value);
                                      return isNaN(parsed) ? 0 : parsed;
                                    },
                                  }}
                                />
                              </div>
                              <div className="col-span-1">
                                <Forger
                                  name={`priceAction.${index}.subItems.${subIndex}.subtotal`}
                                  component={TextInput}
                                  placeholder="Subtotal"
                                  className="h-8"
                                  disabled
                                  control={control as any}
                                />
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
                          )
                        )}
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Add More Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add More
              </Button>
            </div>

            {/* Total */}
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

            {/* Action Buttons */}
            <DialogFooter className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-[#2A4467] hover:bg-[#1e3147]"
                onClick={handleComplete}
              >
                Complete Proposal
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProposalDialog = memo(CompleteProposalDialog);

export default ProposalDialog;
