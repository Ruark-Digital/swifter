import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useFieldArray, Control, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Forger } from "@/lib/forge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { CreateEvaluationFormData } from "./CreateEvaluationDialog";
import { useEffect, useMemo } from "react";

interface Step3FormProps {
  control: Control<CreateEvaluationFormData>;
  isEdit?: boolean;
}

const Step3Form = ({ control, isEdit = false }: Step3FormProps) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "documents"
  });

  const value = useWatch({ control, name: "group" });
  const documentsWatch = useWatch({ control, name: "documents" });

  // Check if a PRICING document already exists
  const hasPricingDocument = useMemo(() => {
    return documentsWatch?.some(doc => doc?.type === "PRICING") || false;
  }, [documentsWatch]);

  // Watch for type changes and automatically set required to true for PRICING
  useEffect(() => {
    if (documentsWatch) {
      documentsWatch.forEach((doc, index) => {
        if (doc?.type === "PRICING" && !doc?.required) {
          update(index, { ...doc, required: true });
        }
      });
    }
  }, [documentsWatch, update]);

  const addDocument = () => {
    append({ 
      title: "", 
      type: "", 
      group: "",
      required: false,
      multiple: false
    });
  };

  const removeDocument = (index: number) => {
    remove(index);
  };

  const documentTypeOptions = [
    { label: "PRICING", value: "PRICING" },
    { label: "DOC", value: "DOC" },
    { label: "PDF", value: "PDF" },
    { label: "XLSX", value: "XLSX" },
    { label: "PNG", value: "PNG" },
    { label: "ZIP", value: "ZIP" }
  ];

  // Create dynamic document type options based on existing documents
  const getDocumentTypeOptions = (currentIndex: number) => {
    const currentDocType = documentsWatch?.[currentIndex]?.type;
    
    return documentTypeOptions.map(option => {
      // If this is a PRICING option and a PRICING document already exists
      // and the current document is not already PRICING, disable it
      if (option.value === "PRICING" && hasPricingDocument && currentDocType !== "PRICING") {
        return { ...option, disabled: true };
      }
      return option;
    });
  };

  // Fetch evaluation groups from API
  const { data: evaluationGroupsData } = useQuery<
    ApiResponse<{ _id: string; name: string; groupName?: string }[]>,
    ApiResponseError
  >({
    queryKey: ["evaluationGroups"],
    queryFn: async () =>
      await getRequest({ url: "/procurement/evaluations/groups" }),
  });

  // usePersist({
  //   control,
  //   handler(payload, formState) {
  //     console.log({ payload, formState })
  //   },
  // })

  // Transform API data to options format and append to static options
  const apiEvaluationGroupOptions = evaluationGroupsData?.data?.data?.map((group) => ({
    label: group.name || group.groupName || `Group ${group._id}`,
    value: group._id,
  })) || [];

  const evaluationGroupFormOptions = value?.map((group) => ({
    label: group.name,
    value: group.name,
  })) || [];

  // Combine static and API options
  const evaluationGroupOptions = [
    ...apiEvaluationGroupOptions,
    ...evaluationGroupFormOptions
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700 border-b pb-2 text-center">
          <div>Document Title</div>
          <div>Type</div>
          <div>Select Eva. Group</div>
          <div>Required</div>
          <div>Actions</div>
        </div>
        
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-5 gap-4 items-center border-b pb-4">
            <div>
              <Forger
                placeholder="Document Title"
                name={`documents.${index}.title`}
                containerClass="w-full"
                component={TextInput}
              />
            </div>
            
            <div>
              <Forger
                name={`documents.${index}.type`}
                placeholder="Select Type"
                component={TextSelect}
                options={getDocumentTypeOptions(index)}
                containerClass="w-full"
              />
            </div>
            
            <div>
              <Forger
                name={`documents.${index}.group`}
                placeholder="Select Evaluation Group"
                component={TextSelect}
                options={evaluationGroupOptions}
                containerClass="w-full"
              />
            </div>
            
            <div className="flex justify-center">
              <Forger
                name={`documents.${index}.required`}
                component={({ value, onChange, ...props }: any) => (
                  <Checkbox
                    checked={value || false}
                    onCheckedChange={(checked) => onChange(checked)}
                    {...props}
                  />
                )}
              />
            </div>
            
            <div className="flex justify-center">
             {index !== 0 && !isEdit && <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>}
            </div>
          </div>
        ))}
        
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={addDocument}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step3Form;