import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useFieldArray, Control, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Forger } from "@adexdsamson/forge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";
import { CreateEvaluationFormData } from "./CreateEvaluationDialog";
import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToastHandler } from "@/hooks/useToaster";
import { useDeleteEvaluationDocument } from "../hooks/useEvaluationDetailApi";

interface Step3FormProps {
  control: Control<CreateEvaluationFormData>;
  isEdit?: boolean;
  evaluationId?: string;
  onDocumentDeleted?: () => void;
}

const Step3Form = ({
  control,
  isEdit = false,
  evaluationId,
  onDocumentDeleted,
}: Step3FormProps) => {
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

  const toast = useToastHandler();
  const { mutateAsync: deleteDocument, isPending: isDeletingDocument } =
    useDeleteEvaluationDocument();
  // Index of a saved document awaiting delete confirmation
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

  // Saved documents carry the server id (set by EditEvaluationDialog)
  const getDocumentId = (index: number) =>
    (documentsWatch?.[index] as { id?: string } | undefined)?.id;

  const removeDocument = (index: number) => {
    // Saved documents are deleted on the server after confirmation;
    // rows added in this session are only removed locally.
    if (isEdit && getDocumentId(index)) {
      setPendingDeleteIndex(index);
      return;
    }
    remove(index);
  };

  const confirmDeleteDocument = async () => {
    if (pendingDeleteIndex === null) return;
    const documentId = getDocumentId(pendingDeleteIndex);
    if (!evaluationId || !documentId) return;
    try {
      await deleteDocument({ evaluationId, documentId });
      remove(pendingDeleteIndex);
      onDocumentDeleted?.();
      toast.success("Document Removed", "Requested document has been removed");
    } catch (error) {
      const err = error as ApiResponseError;
      toast.error(
        "Remove Failed",
        err?.response?.data?.message ?? "Failed to remove requested document"
      );
    } finally {
      setPendingDeleteIndex(null);
    }
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
             {(isEdit ? fields.length > 1 : index !== 0) && <Button
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

      <AlertDialog
        open={pendingDeleteIndex !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingDocument) setPendingDeleteIndex(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove requested document?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDeleteIndex !== null && documentsWatch?.[pendingDeleteIndex]?.title}"
              will be removed from this evaluation. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingDocument}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(event) => {
                event.preventDefault();
                void confirmDeleteDocument();
              }}
              disabled={isDeletingDocument}
            >
              {isDeletingDocument ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Step3Form;