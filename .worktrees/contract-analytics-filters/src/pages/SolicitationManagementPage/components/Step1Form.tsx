import React, { useState } from "react";
import { Forger } from "@/lib/forge";
import { TextCurrencyInput, TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { TextArea } from "@/components/layouts/FormInputs/TextArea";
import { TextSelectWithSearch } from "@/components/layouts/FormInputs";
import CreateCategoryDialog from "./CreateCategoryDialog";

interface Step1FormProps {
  solicitationTypes: Array<{ label: string; value: string }>;
  categoryOptions: Array<{ label: string; value: string }>;
  showSolId?: boolean;
}

const Step1Form: React.FC<Step1FormProps> = ({
  solicitationTypes,
  categoryOptions,
  showSolId = false,
}) => {
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const handleCreateNew = () => {
    setCreateCategoryOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <Forger
        component={TextInput}
        name="solicitationName"
        label="Solicitation Name"
        placeholder="Enter Title"
        containerClass="space-y-2"
      />

      {/* Solicitation ID (Optional) */}
      {showSolId && (
        <Forger
          component={TextInput}
          name="solId"
          label="Solicitation ID (optional)"
          placeholder="Enter Solicitation ID"
          containerClass="space-y-2"
        />
      )}

      {/* Solicitation Type */}
      <Forger
        name="solicitationType"
        component={TextSelect}
        options={solicitationTypes}
        label="Solicitation Type"
        placeholder="Select type"
        containerClass="mb-6"
      />

      {/* Estimated Cost */}
      <Forger
        component={TextCurrencyInput}
        name="estimatedCost"
        label={
          <span>
            Estimated Cost{" "}
            <span className="text-gray-500">
              (only visible internally)
            </span>
          </span>
        }
        placeholder="Enter estimate cost"
        type="number"
        containerClass="space-y-2"
      />

      {/* Category */}
      <Forger
        name="category"
        component={TextSelectWithSearch}
        label="Category"
        placeholder="Select category"
        options={categoryOptions}
        containerClass="mb-6"
        showCreateNew
        createNewLabel="Create new category"
        emptyMessage="No category found"
        onCreateNew={handleCreateNew}
      />

      {/* Description */}
      <Forger
        component={TextArea}
        name="description"
        label="Description"
        placeholder="Enter Detail"
        rows={5}
        containerClass="space-y-2 "
      />

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
      />
    </div>
  );
};

export default Step1Form;