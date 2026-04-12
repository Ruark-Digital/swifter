import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, Forger, useForge } from "@/lib/forge";
import { TextArea, TextInput, TextSelect } from "@/components/layouts/FormInputs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";

type Props = {
  trigger: React.ReactNode;
  createPath?: string;
  invalidateQueryKey?: readonly unknown[];
};

type ClaimFormValues = {
  claimTitle: string;
  claimType: string;
  impactType: "time" | "cost" | "time_cost";
  timeImpact: string;
  costImpact: string;
  description: string;
};

const RequestClaimDialog: React.FC<Props> = ({
  trigger,
  createPath,
  invalidateQueryKey,
}) => {
  const [open, setOpen] = React.useState(false);
  const qc = useQueryClient();
  const toast = useToastHandler();
  const { control, setValue, watch } = useForge<ClaimFormValues>({
    defaultValues: {
      claimTitle: "",
      claimType: "",
      impactType: "time",
      timeImpact: "",
      costImpact: "",
      description: "",
    },
  });

  const impactType = watch("impactType");
  console.log({ createPath });

  const createMutation = useMutation({
    mutationKey: ["create-claim", createPath],
    mutationFn: async (payload: any) => {
      if (!createPath) throw new Error("Create claim endpoint unavailable");
      const res = await postRequest({
        url: createPath,
        payload,
      });
      return res.data;
    },
    onSuccess: async () => {
      toast.success("Claim", "Claim submitted successfully");
      if (invalidateQueryKey) {
        await qc.invalidateQueries({ queryKey: invalidateQueryKey });
      }
      setOpen(false);
    },
    onError: (error) => {
      console.log({ error });
      toast.error("Claim", error as any);
    },
  });

  const handleClaimSubmit = (data: ClaimFormValues) => {
    const payload = {
      title: data.claimTitle,
      type: data.claimType,
      impact: data.impactType,
      time:
        data.impactType === "time" || data.impactType === "time_cost"
          ? Number(data.timeImpact)
          : undefined,
      cost:
        data.impactType === "cost" || data.impactType === "time_cost"
          ? Number(data.costImpact)
          : undefined,
      descrption: data.description,
    };
    createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <div className="flex items-center justify-between px-8 pt-8">
          <DialogTitle className="text-xl font-semibold text-[#0F0F0F]">
            Request Claim
          </DialogTitle>
        </div>
        <div className="px-8 pb-8 pt-6">
          <Forge<ClaimFormValues>
            control={control}
            onSubmit={handleClaimSubmit}
            className="space-y-5"
          >
            <Forger
              name="claimTitle"
              label="Claim Title"
              placeholder="Enter Title"
              component={TextInput}
            />
            <Forger
              name="claimType"
              label="Claim Type"
              placeholder="Select Type"
              component={TextSelect}
              options={[
                {
                  label: "Vendor-caused Delay",
                  value: "vendor_delay",
                },
                { label: "Scope Change", value: "scope_change" },
                {
                  label: "Weather Conditions",
                  value: "weather_conditions",
                },
                { label: "Force Majeure", value: "force_majeure" },
                {
                  label: "Regulatory Change",
                  value: "regulatory_change",
                },
                { label: "Error / Omission", value: "error" },
                { label: "Warranty Claim", value: "warranty" },
                {
                  label: "Other (requires explanation)",
                  value: "other",
                },
              ]}
            />
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-6">
                <button
                  type="button"
                  onClick={() => setValue("impactType", "time")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      impactType === "time"
                        ? "border-[#2A4467] bg-[#F9FAFB]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    {impactType === "time" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[#374151]">
                    Time Impact
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("impactType", "cost")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      impactType === "cost"
                        ? "border-[#2A4467] bg-[#F9FAFB]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    {impactType === "cost" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[#374151]">
                    Cost Impact
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setValue("impactType", "time_cost")}
                  className="flex items-center gap-2"
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      impactType === "time_cost"
                        ? "border-[#2A4467] bg-[#F9FAFB]"
                        : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    {impactType === "time_cost" && (
                      <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-[#374151]">
                    Time & Cost Impact
                  </span>
                </button>
              </div>
              {impactType === "time" && (
                <Forger
                  name="timeImpact"
                  label="Time"
                  placeholder="Enter no. of days"
                  component={TextInput}
                />
              )}
              {impactType === "cost" && (
                <Forger
                  name="costImpact"
                  label="Cost"
                  placeholder="Enter Amount"
                  component={TextInput}
                />
              )}
              {impactType === "time_cost" && (
                <div className="grid grid-cols-2 gap-4">
                  <Forger
                    name="timeImpact"
                    label="Time"
                    placeholder="Enter Date"
                    component={TextInput}
                  />
                  <Forger
                    name="costImpact"
                    label="Cost"
                    placeholder="Enter Amount"
                    component={TextInput}
                  />
                </div>
              )}
            </div>
            <Forger
              name="description"
              label="Description"
              placeholder="Enter Detail"
              component={TextArea}
              rows={4}
            />
            <div className="flex items-center gap-4 pt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 flex-1 rounded-xl border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F] hover:bg-[#E5E7EB]"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={createMutation.isPending || !createPath}
                className="h-12 flex-1 rounded-xl bg-[#2A4467] text-base font-semibold text-white hover:bg-[#1f3552]"
              >
                {createMutation.isPending ? "Submitting..." : "Request Claim"}
              </Button>
            </div>
          </Forge>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestClaimDialog;
