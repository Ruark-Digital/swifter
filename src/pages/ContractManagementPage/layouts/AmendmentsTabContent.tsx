import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Forge, Forger, useForge } from "@/lib/forge";
import {
  TextArea,
  TextFileUploader,
  TextInput,
} from "@/components/layouts/FormInputs";
import { AlertTriangle, Check, CloudUpload, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useWatch } from "react-hook-form";
import AmendmentsStatsCards from "../components/AmendmentsStatsCards";
import AmendmentsTable, {
  type AmendmentRow,
} from "../components/AmendmentsTable";
import { useQuery } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import type { ApiResponseError } from "@/types";
import {
  contractManagerApi,
  type ContractAmendmentDTO,
  type ContractAmendmentStatsDTO,
} from "../api/contractManagerApi";
import { useUserRole } from "@/hooks/useUserRole";
import { approverApi } from "../api/approverApi";

type CreateAmendmentFormValues = {
  amendmentTitle: string;
  impactType: "time" | "cost" | "time_cost" | "other";
  timeImpactDays: string;
  costImpactAmount: string;
  scopeEnabled: boolean;
  expiryEnabled: boolean;
  costEnabled: boolean;
  clauseEnabled: boolean;
  othersEnabled: boolean;
  scope: string;
  newExpiryDate: string;
  otherCost: string;
  clause: string;
  otherDetails: string;
  description: string;
  files: File[] | null;
};

const UploadElement = () => {
  return (
    <div className="flex flex-col items-center gap-3">
      <CloudUpload className="h-12 w-12 text-[#2A4467]" />
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold text-[#2A4467]">
          Drag &amp; Drop or Click to choose files
        </p>
        <p className="text-sm text-[#6B7280]">
          Supported formats: DOC, PDF, XLS, XLSLS, ZIP, PNG, JPEG
        </p>
      </div>
    </div>
  );
};

const CreateAmendmentDialog: React.FC<{ trigger: React.ReactElement }> = ({
  trigger,
}) => {
  const [open, setOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);

  const { control, reset } = useForge<CreateAmendmentFormValues>({
    defaultValues: {
      amendmentTitle: "",
      impactType: "time",
      timeImpactDays: "",
      costImpactAmount: "",
      scopeEnabled: true,
      expiryEnabled: true,
      costEnabled: true,
      clauseEnabled: false,
      othersEnabled: false,
      scope: "",
      newExpiryDate: "",
      otherCost: "",
      clause: "",
      otherDetails: "",
      description: "",
      files: null,
    },
  });

  const impactType = useWatch({ control, name: "impactType" });
  const scopeEnabled = useWatch({ control, name: "scopeEnabled" });
  const expiryEnabled = useWatch({ control, name: "expiryEnabled" });
  const costEnabled = useWatch({ control, name: "costEnabled" });
  const clauseEnabled = useWatch({ control, name: "clauseEnabled" });
  const othersEnabled = useWatch({ control, name: "othersEnabled" });

  const handleSubmit = (data: CreateAmendmentFormValues) => {
    void data;
    setOpen(false);
    reset();
  };

  const FileListItem = ({ file }: { file: File }) => {
    return <div className="hidden">{file.name}</div>;
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
      >
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent
          showCloseButton={false}
          className="max-h-[90vh] w-full max-w-[700px] gap-0 overflow-hidden rounded-2xl border-0 p-0"
        >
          <Forge
            control={control}
            onSubmit={handleSubmit}
            className="flex max-h-[90vh] flex-col"
          >
            <div className="flex items-center justify-between px-8 pb-2 pt-8">
              <div className="text-xl font-semibold text-[#0F0F0F]">
                Create Amendment
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#EF4444]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-8 pb-8 pt-4">
              <Forger
                name="amendmentTitle"
                label="Amendment Title"
                placeholder="Enter Title"
                component={TextInput}
              />

              <Forger
                name="impactType"
                component={({
                  value,
                  onChange,
                }: {
                  value?: string;
                  onChange: (val: string) => void;
                }) => (
                  <div className="flex flex-wrap gap-6">
                    {[
                      {
                        id: "impact-time",
                        value: "time",
                        label: "Time Impact",
                      },
                      {
                        id: "impact-cost",
                        value: "cost",
                        label: "Cost Impact",
                      },
                      {
                        id: "impact-time-cost",
                        value: "time_cost",
                        label: "Time & Cost Impact",
                      },
                      {
                        id: "impact-other",
                        value: "other",
                        label: "Other Combinations",
                      },
                    ].map((option) => {
                      const isSelected = value === option.value;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => onChange(option.value)}
                          className="flex items-center gap-3 text-sm font-semibold text-[#374151]"
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                              isSelected
                                ? "border-[#2A4467] bg-[#F9F5FF]"
                                : "border-[#E5E7EB] bg-white"
                            }`}
                          >
                            {isSelected && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#2A4467]" />
                            )}
                          </span>
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              />

              {impactType === "time" && (
                <Forger
                  name="timeImpactDays"
                  label="New Expiry/ Delivery / Completion Date"
                  placeholder="Enter no. of days"
                  component={TextInput}
                />
              )}

              {impactType === "cost" && (
                <Forger
                  name="costImpactAmount"
                  label="Cost"
                  placeholder="Enter Amount"
                  component={TextInput}
                />
              )}

              {impactType === "time_cost" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Forger
                    name="timeImpactDays"
                    label="New Expiry/ Delivery / Completion Date"
                    placeholder="Enter no. of days"
                    component={TextInput}
                  />
                  <Forger
                    name="costImpactAmount"
                    label="Cost"
                    placeholder="Enter Amount"
                    component={TextInput}
                  />
                </div>
              )}

              {impactType === "other" && (
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4 shadow-[0_-1px_4px_0px_rgba(0,26,43,0.05)] space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F]">
                        Scope
                      </div>
                      <Forger
                        name="scopeEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="scope"
                      placeholder="Enter Scope"
                      component={TextInput}
                      disabled={!scopeEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F]">
                        New Expiry/ Delivery / Completion Date
                      </div>
                      <Forger
                        name="expiryEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="newExpiryDate"
                      placeholder="Enter Date"
                      component={TextInput}
                      disabled={!expiryEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F]">
                        Cost
                      </div>
                      <Forger
                        name="costEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#2A4467] data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="otherCost"
                      placeholder="Enter Amount"
                      component={TextInput}
                      disabled={!costEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F]">
                        Clause
                      </div>
                      <Forger
                        name="clauseEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#E5E7EB] data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="clause"
                      placeholder="Enter Detail"
                      component={TextInput}
                      disabled={!clauseEnabled}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-[#0F0F0F]">
                        Others
                      </div>
                      <Forger
                        name="othersEnabled"
                        component={({
                          value,
                          onChange,
                        }: {
                          value?: boolean;
                          onChange: (val: boolean) => void;
                        }) => (
                          <Checkbox
                            checked={!!value}
                            onCheckedChange={(checked) => onChange(!!checked)}
                            className="h-6 w-6 rounded-md border-[#E5E7EB] data-[state=checked]:bg-[#2A4467] data-[state=checked]:border-[#2A4467]"
                          />
                        )}
                      />
                    </div>
                    <Forger
                      name="otherDetails"
                      placeholder="Enter Detail"
                      component={TextInput}
                      disabled={!othersEnabled}
                    />
                  </div>
                </div>
              )}

              <Forger
                name="description"
                label="Description"
                placeholder="Enter Detail"
                component={TextArea}
                rows={5}
              />
              <div className="space-y-4">
                <div className="text-base font-semibold text-[#0F0F0F]">
                  Upload Files
                </div>
                <Forger
                  name="files"
                  component={TextFileUploader}
                  element={<UploadElement />}
                  List={FileListItem}
                  className="rounded-xl border border-dashed border-[#2A4467]"
                  accept={
                    {
                      "application/pdf": [".pdf"],
                      "application/msword": [".doc"],
                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                        [".docx"],
                      "application/vnd.ms-excel": [".xls"],
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                        [".xlsx"],
                      "application/zip": [".zip"],
                      "image/png": [".png"],
                      "image/jpeg": [".jpeg", ".jpg"],
                    } as any
                  }
                />
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-[#2A44671A] bg-[#F8F8F8] p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EF4444] text-[#EF4444]">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-[#0F0F0F]">
                    Vendor Acceptance Required
                  </div>
                  <div className="text-sm text-[#626262]">
                    This amendment includes a time impact, but no approver has
                    been assigned to review time-related impacts.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 px-8 py-4">
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] text-base font-semibold text-[#0F0F0F]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#2A4467] px-6 text-base font-semibold text-white"
              >
                Create Amendment
              </Button>
            </div>
          </Forge>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-md rounded-2xl border-0 px-8 py-10"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#22C55E] text-[#22C55E]">
              <Check className="h-8 w-8" />
            </div>
            <div className="text-base font-semibold text-[#0F0F0F]">
              Amendment Created Successfully
            </div>
            <Button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#2A4467] text-base font-semibold text-white"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

type Props = {
  contractId: string;
  isActive?: boolean;
};

const AmendmentsTabContent: React.FC<Props> = ({ contractId, isActive }) => {
  const { isApprover } = useUserRole();
  const statsQueryKey = useUserQueryKey([
    "contract-amendments-stats",
    contractId,
    isApprover ? "approver" : "manager",
  ]);
  const amendmentsQueryKey = useUserQueryKey([
    "contract-amendments",
    contractId,
    isApprover ? "approver" : "manager",
  ]);

  const { data: statsRes, isLoading: isStatsLoading } = useQuery<
    {
      message?: string;
      data?: ContractAmendmentStatsDTO;
    },
    ApiResponseError
  >({
    queryKey: statsQueryKey,
    queryFn: async () => {
      if (isApprover) {
        return await approverApi.getAmendmentStats(contractId);
      }
      return await contractManagerApi.getAmendmentStats(contractId);
    },
    enabled: Boolean(contractId) && !!isActive,
    staleTime: 60000,
    retry: false,
  });

  const { data: amendmentsRes, isLoading: isAmendmentsLoading } = useQuery<
    { message?: string; data?: ContractAmendmentDTO[] },
    ApiResponseError
  >({
    queryKey: amendmentsQueryKey,
    queryFn: async () => {
      if (isApprover) {
        return await approverApi.listAmendments(contractId);
      }
      return await contractManagerApi.listAmendments(contractId);
    },
    enabled: Boolean(contractId) && !!isActive,
  });

  const amendmentsRows = React.useMemo<AmendmentRow[]>(() => {
    const amendments = amendmentsRes?.data ?? [];
    const normalizeVendorStatus = (
      value?: string,
    ): AmendmentRow["vendorStatus"] => {
      const normalized = value?.toLowerCase();
      if (normalized === "accepted" || normalized === "approved")
        return "Accepted";
      if (normalized === "rejected") return "Rejected";
      return "Pending";
    };
    const normalizeStatus = (value?: string): AmendmentRow["status"] => {
      const normalized = value?.toLowerCase();
      if (normalized === "approved" || normalized === "accepted")
        return "Approved";
      if (normalized === "rejected") return "Rejected";
      return "Pending";
    };
    return amendments.map((amendment, index) => {
      const amendmentId =
        amendment.amendmentId || amendment._id || `AM-${index + 1}`;
      const amendmentTitle = amendment.title || amendment.amendmentTitle || "-";
      return {
        amendmentId,
        amendmentTitle,
        vendorStatus: normalizeVendorStatus(amendment.vendorStatus),
        status: normalizeStatus(amendment.status),
      };
    });
  }, [amendmentsRes?.data]);

  return (
    <TabsContent value="amendments" className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[#0F0F0F]">Amendments</h3>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="rounded-xl border-[#E5E7EB] px-4 text-base font-semibold text-[#0F0F0F]"
          >
            <img
              src="/assets/contract-management/amendments/share.svg"
              className="mr-2 h-5 w-5"
            />
            Export Report
          </Button>

          {!isApprover && (
            <CreateAmendmentDialog
              trigger={
                <Button className="rounded-xl bg-[#2A4467] px-4 text-base font-semibold text-white hover:bg-[#2A4467]/90">
                  <img
                    src="/assets/contract-management/amendments/plus.svg"
                    className="mr-2 h-5 w-5"
                  />
                  Create Amendment
                </Button>
              }
            />
          )}
        </div>
      </div>

      <AmendmentsStatsCards stats={statsRes?.data} isLoading={isStatsLoading} />

      <AmendmentsTable rows={amendmentsRows} isLoading={isAmendmentsLoading} />
    </TabsContent>
  );
};

export default AmendmentsTabContent;
