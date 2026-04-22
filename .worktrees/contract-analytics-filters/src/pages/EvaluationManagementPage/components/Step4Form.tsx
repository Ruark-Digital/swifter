import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { useFieldArray, Control, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { Forger } from "@/lib/forge";
import { TextInput, TextArea } from "@/components/layouts/FormInputs/TextInput";
import { TextSelect } from "@/components/layouts/FormInputs/TextSelect";
import { useQuery } from "@tanstack/react-query";
import { ApiResponse, ApiResponseError } from "@/types";
import { getRequest } from "@/lib/axiosInstance";
import { CreateEvaluationFormData } from "./CreateEvaluationDialog";

interface Step4FormProps {
  control: Control<CreateEvaluationFormData>;
}

const Step4Form = ({ control }: Step4FormProps) => {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "criteria",
  });

  const value = useWatch({ control, name: "group" });
  const criteriaTypes = useWatch({ control, name: "criteria" });

  // Calculate total weight score
  const totalWeightScore = criteriaTypes?.reduce((total, criteria) => {
    if (criteria.type === "weight" && criteria.score) {
      const score = parseFloat(String(criteria.score));
      return total + (isNaN(score) ? 0 : score);
    }
    return total;
  }, 0) || 0;

  // Watch for type changes and reset score to "pass" when switching to pass_fail
  useEffect(() => {
    criteriaTypes?.forEach((criteria, index) => {
      if (criteria.type === "pass_fail" && criteria.score !== "pass") {
        update(index, { ...criteria, score: "pass" });
      }
    });
  }, [criteriaTypes, update]);

  const addCriteria = () => {
    append({
      title: "",
      description: "",
      type: "pass_fail",
      score: "pass",
      group: "",
    });
  };

  const removeCriteria = (index: number) => {
    remove(index);
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

  // Transform API data to options format and append to static options
  const apiEvaluationGroupOptions =
    evaluationGroupsData?.data?.data?.map((group) => ({
      label: group.name || group.groupName || `Group ${group._id}`,
      value: group._id,
    })) || [];

  const evaluationGroupFormOptions =
    value?.map((group) => ({
      label: group.name,
      value: group.name,
    })) || [];

  // Combine static and API options
  const evaluationGroupOptions = [
    ...apiEvaluationGroupOptions,
    ...evaluationGroupFormOptions,
  ];

  const typeOptions = [
    { label: "Pass/Fail", value: "pass_fail" },
    { label: "Weight", value: "weight" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
          i
        </div>
        <span className="text-sm text-gray-700">
          (Total Weight must equal 100%)
        </span>
      </div>

      {/* Total Score Indicator */}
      <div className={`border rounded-lg px-3 py-1 flex items-center justify-between ${
        totalWeightScore === 100 
          ? "bg-green-50 border-green-200" 
          : totalWeightScore > 100 
          ? "bg-red-50 border-red-200" 
          : "bg-yellow-50 border-yellow-200"
      }`}>
        <span className="text-sm font-medium text-gray-700">
          Total Weight Score:
        </span>
        <span className={`text-lg font-bold ${
          totalWeightScore === 100 
            ? "text-green-600" 
            : totalWeightScore > 100 
            ? "text-red-600" 
            : "text-yellow-600"
        }`}>
          {totalWeightScore}%
        </span>
      </div>

      <div className="space-y-4">
        {/* Header Row */}
        <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700 border-b pb-2 text-center">
          <div>Criteria Title</div>
          <div>Description</div>
          <div>Type</div>
          <div>Score</div>
          <div>Select Eva. Group</div>
          <div>Actions</div>
        </div>

        {/* Criteria Rows */}
        {fields.map((field, index) => {
          const criteriaType = criteriaTypes?.[index]?.type;
          
          return (
            <div
              key={field.id}
              className="grid grid-cols-6 gap-4 items-start border-b pb-4"
            >
              <div>
                <Forger
                  placeholder="Criteria Title"
                  name={`criteria.${index}.title`}
                  containerClass="w-full"
                  component={TextInput}
                />
              </div>

              <div>
                <Forger
                  placeholder="Enter detailed description..."
                  name={`criteria.${index}.description`}
                  containerClass="w-full"
                  component={TextArea}
                  rows={3}
                />
              </div>

              <div>
                <Forger
                  name={`criteria.${index}.type`}
                  placeholder="Select Type"
                  component={TextSelect}
                  options={typeOptions}
                  containerClass="w-full"
                />
              </div>

              <div>
                {criteriaType === "pass_fail" ? (
                  <Forger
                    key={`pass_fail_${index}`}
                    name={`criteria.${index}.score`}
                    placeholder="Select Pass/Fail"
                    component={TextSelect}
                    disabled
                    options={[
                      { label: "Pass/Fail", value: "pass" },
                    ]}
                    containerClass="w-full"
                    defaultValue={String(criteriaTypes?.[index]?.score || "pass")}
                  />
                ) : (
                  <Forger
                    key={`weight_${index}`}
                    placeholder="Enter Value"
                    name={`criteria.${index}.score`}
                    containerClass="w-full"
                    component={TextInput}
                    type="number"
                    min="0"
                    max="100"
                  />
                )}
              </div>

            <div>
              <Forger
                name={`criteria.${index}.group`}
                placeholder="Select Evaluation Group"
                component={TextSelect}
                options={evaluationGroupOptions}
                containerClass="w-full"
              />
            </div>

              <div className="flex justify-center pt-2">
                {index !== 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCriteria(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Criteria Button */}
        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addCriteria}
            className="flex items-center gap-2 text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            <Plus className="h-4 w-4" />
            Add Criteria
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Step4Form;
