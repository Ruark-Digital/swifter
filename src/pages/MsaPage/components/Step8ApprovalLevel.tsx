import React from "react";
import { Forger } from "@/lib/forge";
import {
  TextSelect,
  TextTagInput,
} from "@/components/layouts/FormInputs";
import { useFormContext, useWatch } from "react-hook-form";
import { CreateMsaFormData } from "../layouts/CreateMSADialog";
import { useQuery } from "@tanstack/react-query";
import { getRequest } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";

type ApproverTag = {
  id?: string;
  text?: string;
  value?: string;
  email?: string;
  meta?: Record<string, unknown>;
};

const Step8ApprovalLevel: React.FC = () => {
  const { control, setValue } = useFormContext<CreateMsaFormData>();

  const { data: personnelData } = useQuery({
    queryKey: ["contract-personnel"],
    queryFn: async () => await getRequest({ url: "/contract/manager/personnel" }),
    staleTime: 60000,
  });

  const approverTags: ApproverTag[] = React.useMemo(() => {
    const people = Array.isArray((personnelData as any)?.data?.data)
      ? (personnelData as any)?.data?.data
      : [];
    return people.map((p: any) => {
      const email = p.email ?? "";
      const name = p.firstName || email || p._id;
      const label = email && name && email !== name ? `${name}` : name;
      const value = p._id || email;
      return {
        id: value,
        value,
        text: label,
        meta: { email, role: p.role?.[0]?.name },
      };
    });
  }, [personnelData]);

  const approvalGroups = useWatch({ control, name: "approvalGroups" }) as Array<{ name?: string }> | undefined;
  const assignedApprovers = useWatch({ control, name: "assignedApprovers" }) as ApproverTag[] | undefined;

  const groupOptions =
    approvalGroups && approvalGroups.length > 0
      ? approvalGroups.map((g, idx) => ({
          label: g?.name ? `${g.name} - Approval Level` : `Group ${idx + 1} - Approval Level`,
          value: g?.name || `group_${idx + 1}`,
        }))
      : [{ label: "Group 1 - Approval Level", value: "group_1" }];

  const rows = approverTags.slice(0, 3);

  const assignApprover = (tag: ApproverTag) => {
    const list = assignedApprovers || [];
    const exists = list.some(
      (t) => (t.value || t.id || t.text) === (tag.value || tag.id || tag.text),
    );
    if (!exists) {
      setValue("assignedApprovers", [...list, tag], { shouldDirty: true, shouldTouch: true });
    }
  };

  return (
    <div className="space-y-6">
      <Forger
        name="approvalGroupSelection"
        label="Select Approvers For Contract Execution"
        placeholder="Select Group"
        component={TextSelect}
        options={groupOptions}
      />

      <div className="rounded-2xl border border-slate-200">
        <div className="grid grid-cols-[1fr_200px_140px] items-center px-6 py-3 border-b text-sm font-semibold text-[#2A4467]">
          <div>Group</div>
          <div className="text-center">Role</div>
          <div className="text-center">Action</div>
        </div>
        <div className="px-6 py-4 space-y-4">
          {rows.map((tag, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_200px_140px] items-center">
              <div className="space-y-1">
                <p className="text-sm text-[#0F0F0F]">{tag.text}</p>
                {!!tag.meta?.email && (
                  <p className="text-xs text-slate-500">{String(tag.meta.email)}</p>
                )}
              </div>
              <div className="text-sm text-[#0F0F0F] text-center">
                {String(tag.meta?.role || "Legal")}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-[#0F0F0F]"
                  onClick={() => assignApprover(tag)}
                >
                  Assign
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[#0F0F0F]">Assigned Approvers</p>
        <Forger
          name="assignedApprovers"
          component={TextTagInput}
          enableAutocomplete
          autocompleteOptions={approverTags}
          inputProps={{ autoComplete: "off", placeholder: "Search" }}
          inputClassName="border-0"
          inlineTagsContainerClassName="border-0 outline-0 hover:border-0 focus:border-0 focus-within:ring-0"
        />
      </div>
    </div>
  );
};

export default Step8ApprovalLevel;
