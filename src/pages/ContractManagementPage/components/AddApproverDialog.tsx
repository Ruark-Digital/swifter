import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@adexdsamson/forge";
import {
  TextInput,
  TextTagInput,
  TextCurrencyInput,
  TextSelect,
} from "@/components/layouts/FormInputs";
import { getRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import type { ApiResponse, ApiResponseError } from "@/types";
import { contractManagerApi } from "../api/contractManagerApi";
import {
  getPersonnelOptionLabel,
  isApproverPersonnel,
  type PersonnelLike,
} from "../lib/approverSelection";

type PersonnelItem = PersonnelLike;

type ApproverTag = {
  id?: string;
  value?: string;
  text?: string;
  email?: string;
};

type AddApproverFormValues = {
  groupName: string;
  approvers: ApproverTag[];
  level: string;
  amount: string;
};

const LEVEL_OPTIONS = [
  { label: "Level 1 (Lowest)", value: "1" },
  { label: "Level 2", value: "2" },
  { label: "Level 3", value: "3" },
  { label: "Level 4", value: "4" },
  { label: "Level 5 (Highest)", value: "5" },
];

const tagToUserKey = (tag: ApproverTag): string =>
  String(tag?.value ?? tag?.id ?? tag?.email ?? "").trim();

const AddApproverDialog: React.FC<{
  contractId: string;
  trigger: React.ReactNode;
}> = ({ contractId, trigger }) => {
  const [open, setOpen] = React.useState(false);
  const toastHandler = useToastHandler();
  const queryClient = useQueryClient();
  const approversQueryKey = useUserQueryKey(["contract-approvers", contractId]);

  const { control, reset } = useForge<AddApproverFormValues>({
    defaultValues: { groupName: "", approvers: [], level: "1", amount: "" },
  });

  const { data: personnelRes, isLoading: isLoadingPersonnel } = useQuery({
    queryKey: ["contract-personnel", contractId],
    queryFn: async () =>
      (await getRequest({ url: `/contract/manager/personnel/contract/${contractId}` })) as ApiResponse<
        PersonnelItem[]
      >,
    enabled: open,
    staleTime: 60000,
  });

  const approverOptions = React.useMemo<ApproverTag[]>(() => {
    const people = personnelRes?.data?.data ?? [];
    return people
      .filter(isApproverPersonnel)
      .map((p) => {
        const email = p.email ?? "";
        const fullName = getPersonnelOptionLabel(p);
        const value = p._id || email;
        return {
          id: value,
          value,
          text: fullName,
          email,
          meta: { roles: p.roles ?? p.role },
        };
      });
  }, [personnelRes?.data?.data]);

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["add-contract-approvers", contractId],
    mutationFn: (payload: Parameters<typeof contractManagerApi.addContractApprovers>[1]) =>
      contractManagerApi.addContractApprovers(contractId, payload),
    onSuccess: async () => {
      toastHandler.success("Approvers", "Approver(s) added successfully");
      await queryClient.invalidateQueries({ queryKey: approversQueryKey });
      reset();
      setOpen(false);
    },
    onError: (error: ApiResponseError) => {
      toastHandler.error("Add Approver Failed", error);
    },
  });

  const handleSubmit = async (data: AddApproverFormValues) => {
    const user = (data.approvers ?? [])
      .map(tagToUserKey)
      .filter(Boolean);
    if (!data.groupName?.trim()) {
      toastHandler.error("Add Approver", "Group name is required");
      return;
    }
    if (!user.length) {
      toastHandler.error("Add Approver", "Select at least one approver");
      return;
    }
    await mutateAsync({
      approvers: [
        {
          user,
          groupName: data.groupName.trim(),
          level: Number(data.level) || 1,
          amount: Number(data.amount) || 0,
        },
      ],
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full max-w-lg gap-0 overflow-hidden rounded-2xl border-0 p-0">
        <Forge control={control} onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-6 pb-2 pt-6">
            <div className="text-lg font-semibold text-[#0F0F0F] dark:text-slate-100">
              Add Approver
            </div>
          </div>

          <div className="space-y-4 px-6 pb-4 pt-2">
            <Forger
              name="groupName"
              label="Group Name"
              placeholder="e.g. Finance"
              component={TextInput}
            />
            <Forger
              name="approvers"
              label="Approvers"
              placeholder={
                isLoadingPersonnel ? "Loading approvers..." : "Add approvers"
              }
              component={TextTagInput}
              enableAutocomplete
              autocompleteOptions={approverOptions}
              inputProps={{ autoComplete: "off" }}
            />
            <Forger
              name="level"
              label="Approval Level"
              options={LEVEL_OPTIONS}
              component={TextSelect}
            />
            <Forger
              name="amount"
              label="Amount Threshold"
              placeholder="0"
              component={TextCurrencyInput}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#E5E7EB] dark:border-slate-700 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl px-4"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-10 rounded-xl bg-[#2A4467] px-4 text-white"
              disabled={isPending}
            >
              {isPending ? "Adding..." : "Add Approver"}
            </Button>
          </div>
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default AddApproverDialog;
