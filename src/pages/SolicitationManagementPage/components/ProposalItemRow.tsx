import React from "react";
import { Button } from "@/components/ui/button";
import { ForgeControl, Forger } from "@adexdsamson/forge";
import { TextInput } from "../../../components/layouts/FormInputs/TextInput";
import { Plus, Trash2 } from "lucide-react";
import { FormValues } from "./SubmitProposalPage";
import { numberFieldTransform } from "./proposalFieldTransforms";

interface ProposalItemRowProps {
  index: number;
  onAddSubItem: (index: number) => void;
  onRemoveItem: (index: number) => void;
  control: ForgeControl<FormValues>;
}

const ProposalItemRow: React.FC<ProposalItemRowProps> = ({
  index,
  onAddSubItem,
  onRemoveItem,
  control,
}) => {
  return (
    <div className="grid grid-cols-12 gap-4 py-3">
      <div className="col-span-1 flex items-center text-sm font-medium pl-3">
        {index + 1}
      </div>
      <div className="col-span-2">
        <Forger
          name={`priceAction.${index}.component`}
          component={TextInput}
          placeholder="Item/Component"
          className="h-8"
          control={control as any}
        />
      </div>
      <div className="col-span-2">
        <Forger
          name={`priceAction.${index}.description`}
          component={TextInput}
          placeholder="Description"
          className="h-8"
          control={control as any}
        />
      </div>
      <div className="col-span-1">
        <Forger
          name={`priceAction.${index}.quantity`}
          component={TextInput}
          placeholder="0"
          type="number"
          className="h-8"
          control={control as any}
          transform={numberFieldTransform}
        />
      </div>
      <div className="col-span-2">
        <Forger
          name={`priceAction.${index}.unitOfmeasurement`}
          component={TextInput}
          placeholder=""
          className="h-8"
          control={control as any}
        />
      </div>
      <div className="col-span-1">
        <Forger
          name={`priceAction.${index}.unitPrice`}
          component={TextInput}
          placeholder="0"
          type="number"
          className="h-8"
          control={control as any}
          transform={numberFieldTransform}
        />
      </div>
      <div className="col-span-1">
        <Forger
          name={`priceAction.${index}.subtotal`}
          component={TextInput}
          placeholder="0"
          className="h-8"
          control={control as any}
          disabled
        />
      </div>
      <div className="col-span-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddSubItem(index)}
          className="h-8 px-2"
        >
          <Plus className="h-3 w-3" />
        </Button>
        {index !== 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemoveItem(index)}
            className="h-8 px-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProposalItemRow;
