import React from "react";
import { Forger, useFieldArray } from "@/lib/forge";
import {
  TextCurrencyInput,
  TextInput,
  TextTagInput,
} from "@/components/layouts/FormInputs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { Control, useWatch } from "react-hook-form";
import { CreateContractFormData } from "./CreateContractSheet";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { ApiResponseError } from "@/types";
import { Button } from "@/components/ui/button";

type Props = { control: Control<CreateContractFormData> };

type ApiListResponse<T> = { status: number; message: string; data: T[] };
type Personnel = { _id: string; name: string; email: string };

type ApproverTag = {
  id?: string;
  text?: string;
  value?: string;
  email?: string;
  meta?: Record<string, unknown>;
};

const defaultApprovalGroup = {
  name: "",
  approvers: [],
  amount: "",
  approvalLevel: "",
};
const Step7ApprovalLevel: React.FC<Props> = ({ control }) => {
  const { fields, append } = useFieldArray({
    control,
    name: "approvalGroups",
    inputProps: [],
  });

  const approvalGroups = useWatch({
    control,
    name: "approvalGroups",
  }) as { approvers?: ApproverTag[] }[] | undefined;
  console.log({ approvalGroups });

  const { data: personnelData, isLoading: isLoadingUsers } = useQuery<
    ApiListResponse<Personnel>,
    ApiResponseError
  >({
    queryKey: ["contract-personnel"],
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/personnel" });
      return res.data as ApiListResponse<Personnel>;
    },
    staleTime: 60_000,
  });

  const approverTags = React.useMemo<ApproverTag[]>(() => {
    const people = personnelData?.data ?? [];
    return people.map((p) => {
      const email = p.email ?? "";
      const name = p.name || email || p._id;
      const label =
        email && name && email !== name ? `${name} (${email})` : name;
      const value = p._id || email;
      return {
        id: value,
        value,
        text: label,
        meta: { email },
      };
    });
  }, [personnelData]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Add with email address, name, domain name
      </p>

      <div className="hidden md:grid grid-cols-[200px_300px_220px_140px] gap-8 text-sm font-medium text-slate-700 border-b pb-3">
        <div>Group Name</div>
        <div>Approvers</div>
        <div>Amount Threshold</div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span>Approval Level</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    <InfoIcon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-[#2A4467] text-white border-none">
                  <p className="text-xs font-semibold">Approval Level</p>
                  <p className="mt-1 text-xs">
                    Add people to group based on delegation of authority limits
                  </p>
                  <p className="mt-2 text-xs">1 - Lowest</p>
                  <p className="text-xs">5 - Highest</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 md:grid-cols-[180px_320px_180px_180px] gap-4 md:gap-8 items-start border-b pb-4"
          >
            <Forger
              name={`approvalGroups.${index}.name`}
              placeholder={`Group ${index + 1}`}
              component={TextInput}
            />

            <Forger
              name={`approvalGroups.${index}.approvers`}
              component={TextTagInput}
              placeholder={isLoadingUsers ? "Loading..." : "Add Approvers"}
              enableAutocomplete
              autocompleteOptions={approverTags.filter((tag) => {
                const selected = approvalGroups?.[index]?.approvers ?? [];
                const selectedIds = new Set(
                  selected.map(
                    (approver, idx) =>
                      approver?.value ||
                      approver?.id ||
                      approver?.email ||
                      approver?.text ||
                      String(idx),
                  ),
                );
                const tagKey = tag.value || tag.id || tag.text;
                return tagKey ? !selectedIds.has(tagKey) : true;
              })}
              inputProps={{ autoComplete: "off" }}
              // containerClass="min-h-[7rem] border rounded-lg cursor-pointer"
              inputClassName="border-0"
              inlineTagsContainerClassName="border-0 outline-0 hover:border-0 focus:border-0 focus-within:ring-0"
            />

            <Forger
              name={`approvalGroups.${index}.amount`}
              component={TextCurrencyInput}
              containerClass="!w-40"
              placeholder="$0.00"
            />

            <div className="flex flex-col gap-2">
              <div className="flex justify-between md:hidden text-xs text-slate-500">
                <span>Low</span>
                <span>High</span>
              </div>
              <Forger
                name={`approvalGroups.${index}.approvalLevel`}
                component={({
                  value,
                  onChange,
                }: {
                  value?: string;
                  onChange: (val: string) => void;
                }) => (
                  <RadioGroup
                    value={value ?? ""}
                    onValueChange={onChange}
                    className="flex justify-between gap-4"
                  >
                    {["1", "2", "3", "4", "5"].map((level) => (
                      <div
                        key={level}
                        className="flex flex-col items-center gap-1"
                      >
                        <RadioGroupItem
                          value={level}
                          id={`approval-${index}-${level}`}
                        />
                        <Label
                          htmlFor={`approval-${index}-${level}`}
                          className="text-xs"
                        >
                          {level}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              <div className="hidden md:flex justify-between w-full text-xs text-slate-500 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={() => append(defaultApprovalGroup)}
        className="w-fit  bg-[#2A4467] text-white text-xs font-semibold py-2 rounded-lg"
      >
        Add Approval Group
      </Button>
    </div>
  );
};

export default Step7ApprovalLevel;
