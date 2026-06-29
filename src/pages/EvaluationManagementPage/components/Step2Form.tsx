import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useFieldArray } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Forger } from "@/lib/forge";
import { TextInput } from "@/components/layouts/FormInputs/TextInput";
import { TextMultiSelect } from "@/components/layouts/FormInputs/TextSelect";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponse, ApiResponseError } from "@/types";

// Evaluator type definition
type Evaluator = {
  _id: string;
  email: string;
  status: string;
  name?: string;
};

interface Step2FormProps {
  control: any;
  isEdit?: boolean;
}

const Step2Form = ({ control, isEdit = false }: Step2FormProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "group",
  });

  // Fetch evaluators from API
  const { data: evaluatorsData, isLoading: isLoadingEvaluators } = useQuery<
    ApiResponse<Evaluator[]>,
    ApiResponseError
  >({
    queryKey: ["evaluators"],
    queryFn: async () =>
      await getRequest({
        url: "/procurement/evaluations/evaluators",
      }),
  });

  // Transform evaluators data to options format.
  // Show the evaluator's name as the label, falling back to email when the
  // account has no name set. Email stays searchable via fieldMap.
  const evaluatorOptions =
    evaluatorsData?.data?.data
      ?.map((evaluator) => {
        const name = evaluator.name?.trim();
        return {
          label: name || evaluator.email,
          value: evaluator._id,
          fieldMap: {
            name: name?.toLowerCase?.() ?? "",
            email: evaluator.email ?? "",
          },
        };
      }) || [];


  const addGroup = () => {
    append({ name: "", evaluators: [] });
  };

  const removeGroup = (index: number) => {
    remove(index);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm font-medium text-gray-700 border-b pb-2">
          <div className="w-52">Group Name</div>
          <div className="flex-1">Add Evaluators (Multi-select)</div>
          <div>Actions</div>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-4 border-b pb-4">
            <div className="w-52">
              <Forger
                placeholder="Group Name"
                name={`group.${index}.name`}
                containerClass="w-full"
                component={TextInput}
              />
            </div>

            <div className="space-y-2 flex-1">
              <Forger
                name={`group.${index}.evaluators`}
                placeholder={
                  isLoadingEvaluators
                    ? "Loading evaluators..."
                    : "Select evaluators"
                }
                component={TextMultiSelect}
                options={evaluatorOptions}
                maxCount={10}
                hideClearAllButton={false}
                creatable={true}
                createLabel="Add email"
                enableMultiTermFilter={true}
                multiTermOperator="AND"
                searchFieldsPriority={["name", "email"]}
                emptyIndicator={
                  <p className="text-center text-sm text-gray-500">
                    No evaluators found
                  </p>
                }
              />
            </div>

            <div className="min-w-10">
              {index !== 0 && !isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGroup(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={addGroup}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Group
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step2Form;
