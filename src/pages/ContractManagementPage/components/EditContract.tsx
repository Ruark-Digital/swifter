import React from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { cn } from "@/lib/utils";
import Step1BasicInfo from "@/pages/ContractManagementPage/components/Step1BasicInfo";
import Step2ContractTeam from "@/pages/ContractManagementPage/components/Step2ContractTeam";
import Step3ValuePayments from "@/pages/ContractManagementPage/components/Step3ValuePayments";
import Step4Timeline from "@/pages/ContractManagementPage/components/Step4Timeline";
import Step5Deliverables from "@/pages/ContractManagementPage/components/Step5Deliverables";
import Step4Form from "@/pages/SolicitationManagementPage/components/Step4Form";
import Step7ApprovalLevel from "@/pages/ContractManagementPage/components/Step7ApprovalLevel";
import Step6ComplianceSecurity from "@/pages/ContractManagementPage/components/Step6ComplianceSecurity";
import Step8ReviewPublish from "@/pages/ContractManagementPage/components/Step6ReviewPublish";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, putRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useProjectsList } from "@/pages/ProjectManagementPage/services/useProjectApi";
import { useToastHandler } from "@/hooks/useToaster";
import { useWatch } from "react-hook-form";
import { contractManagerApi } from "@/pages/ContractManagementPage/api/contractManagerApi";
import type { ContractDetail, ApiResponseError } from "@/types";
import { schema as createSchema, defaultValues as createDefaults } from "@/pages/ContractManagementPage/components/CreateContractSheet";
import { format } from "date-fns";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  onUpdated?: (contract: ContractDetail) => void;
};

const STEP_TITLES = [
  "Step 1 of 8: Basic Information",
  "Step 2 of 8: Contract Team",
  "Step 3 of 8: Timeline",
  "Step 4 of 8: Deliverables",
  "Step 5 of 9: Contract Value & Payments",
  "Step 6 of 9: Compliance & Security",
  "Step 7 of 9: Documents",
  "Step 8 of 9: Configure Approval Level",
  "Step 9 of 9: Review & Publish",
];

const toNumberOrUndefined = (value: unknown) => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const match = trimmed.match(/^(-?\\d+(?:\\.\\d+)?)\\s*([a-zA-Z]+)?$/);
    if (!match) return undefined;
    const numeric = Number(match[1]);
    if (!Number.isFinite(numeric)) return undefined;
    const unit = match[2]?.toLowerCase();
    if (!unit) return numeric;
    const factors: Record<string, number> = {
      b: 1,
      byte: 1,
      bytes: 1,
      kb: 1024,
      mb: 1024 ** 2,
      gb: 1024 ** 3,
      tb: 1024 ** 4,
    };
    const factor = factors[unit];
    if (!factor) return undefined;
    return Math.round(numeric * factor);
  }
  const num = Number(value as any);
  return Number.isFinite(num) ? num : undefined;
};

const EditContract: React.FC<Props> = ({ open, onOpenChange, contractId, onUpdated }) => {
  const { control, reset, getValues } = useForge<yup.InferType<typeof createSchema>>({
    resolver: yupResolver(createSchema),
    defaultValues: createDefaults,
    mode: "onChange",
  });

  const [step, setStep] = React.useState(1);
  const qc = useQueryClient();
  const { success, error } = useToastHandler();
  const [lastError, setLastError] = React.useState<ApiResponseError | null>(null);
  const [lastPayload, setLastPayload] = React.useState<any | null>(null);

  const typesQuery = useQuery({
    queryKey: useUserQueryKey(["contract-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/types" });
      return res.data as { status: number; message: string; data: { _id: string; name: string }[] };
    },
    staleTime: 60_000,
  });

  const paymentTermsQuery = useQuery({
    queryKey: useUserQueryKey(["contract-payment-terms"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/payment-terms" });
      return res.data as { status: number; message: string; data: { _id: string; name: string }[] };
    },
    staleTime: 60_000,
  });

  const termTypesQuery = useQuery({
    queryKey: useUserQueryKey(["contract-term-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/terms" });
      return res.data as { status: number; message: string; data: { _id: string; name: string }[] };
    },
    staleTime: 60_000,
  });

  const personnelQuery = useQuery({
    queryKey: useUserQueryKey(["contract-personnel"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/personnel" });
      return res.data as { status: number; message: string; data: { _id: string; name: string; email: string }[] };
    },
    staleTime: 60_000,
  });

  const awardedQuery = useQuery({
    queryKey: useUserQueryKey(["awarded-solicitations"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/awarded-solicitation" });
      return res.data as {
        status: number; message: string; data: { _id: string; name: string; vendor: { _id: string; name: string; email: string } }[];
      };
    },
    staleTime: 60_000,
  });

  const { data: contractRes } = useQuery({
    queryKey: useUserQueryKey(["contract-manager-contracts", contractId]),
    queryFn: () => contractManagerApi.getContract(contractId),
    enabled: !!contractId,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    const contract = contractRes?.data?.data;
    if (!contract) return;
    const relationship =
      contract.contractRelationship === "msa_project" ? "msa" :
      contract.contractRelationship === "standalone" ? "standalone" : "project";

    const paymentTermId =
      paymentTermsQuery.data?.data?.find((t) => t.name === contract.paymentTerms)?._id ?? "";
    const termTypeId =
      termTypesQuery.data?.data?.find((t) => t.name === contract.contractTerm)?._id ?? "";

    const documents =
      (contract.files ?? []).map((f) => ({
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size,
      })) ?? [];

    const deliverables =
      (contract.deliverables ?? []).map((d) => ({
        name: d.name,
        dueDate: d.dueDate ? new Date(d.dueDate) : undefined,
      })) ?? [];

    const approvalGroups =
      (contract.approvers ?? []).map((a) => ({
        name: a.group,
        approvers: (a.user ?? []).map((u, idx) => ({
          value: u.user,
          text: u.userRef || `Approver ${idx + 1}`,
        })),
        approvalLevel: String(a.level ?? 0),
        amount: a.amount ?? "",
      })) ?? [{ name: "", approvers: [], approvalLevel: "0", amount: "" }];

    const insurancePolicies =
      (contract.insurance?.policy ?? []).map((p) => ({ name: p.policyName, limit: String(p.value ?? "") })) ?? [{ name: "", limit: "" }];

    const securityType = contract.insurance?.contractSecurityType?.[0]?.securityType ?? "";
    const securityAmount = contract.insurance?.contractSecurityType?.[0]?.amount ?? "";
    const securityDueDate = contract.insurance?.contractSecurityType?.[0]?.dueDate
      ? new Date(contract.insurance.contractSecurityType[0].dueDate as unknown as string)
      : undefined;
    const securities =
      (contract.insurance?.contractSecurityType ?? []).slice(1).map((s: any) => ({
        type: s.securityType,
        amount: s.amount,
        dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
      })) ?? [];

    reset({
      ...createDefaults,
      name: contract.title ?? "",
      relationship,
      project: contract.project?._id ?? "",
      awardedSolicitation: contract.solicitation ?? "",
      type: contract.contractType?._id ?? "",
      category: contract.category ?? "",
      jobTitle: contract.jobTitle ?? "",
      businessDivision: contract.businessDivision ?? "",
      contractId: contract.contractId ?? "",
      description: contract.description ?? "",
      visibility: contract.visibility ?? "",
      contractValue: contract.contractValue ?? "",
      contingency: contract.contigency ?? "",
      holdback: String(contract.holdBack ?? ""),
      paymentStructure:
        contract.paymentStructure === "Monthly" ? "monthly" :
        contract.paymentStructure === "Milestone" ? "milestone" :
        contract.paymentStructure === "Progress Draw" ? "lump_sum" : "",
      paymentTerm: paymentTermId,
      termType: termTypeId,
      effectiveDate: contract.startDate ? new Date(contract.startDate) : undefined,
      endDate: contract.endDate ? new Date(contract.endDate) : undefined,
      duration: contract.duration ? String(contract.duration) : "",
      deliverables,
      documents,
      draftStartDate: contract.contractFormationStage?.draft?.startDate ? new Date(contract.contractFormationStage.draft.startDate) : undefined,
      draftEndDate: contract.contractFormationStage?.draft?.endDate ? new Date(contract.contractFormationStage.draft.endDate) : undefined,
      reviewStartDate: contract.contractFormationStage?.review?.startDate ? new Date(contract.contractFormationStage.review.startDate) : undefined,
      reviewEndDate: contract.contractFormationStage?.review?.endDate ? new Date(contract.contractFormationStage.review.endDate) : undefined,
      approvalStartDate: contract.contractFormationStage?.approval?.startDate ? new Date(contract.contractFormationStage.approval.startDate) : undefined,
      approvalEndDate: contract.contractFormationStage?.approval?.endDate ? new Date(contract.contractFormationStage.approval.endDate) : undefined,
      executionStartDate: contract.contractFormationStage?.execution?.startDate ? new Date(contract.contractFormationStage.execution.startDate) : undefined,
      executionEndDate: contract.contractFormationStage?.execution?.endDate ? new Date(contract.contractFormationStage.execution.endDate) : undefined,
      approvalGroups,
      insuranceExpiryDate: contract.insurance?.expiryDate ? new Date(contract.insurance.expiryDate) : undefined,
      contractSecurity: contract.insurance?.contractSecurity ? "yes" : "no",
      securityType,
      securityAmount: String(securityAmount ?? ""),
      securityDueDate,
      insurancePolicies,
      securities,
      rating: contract.rating ?? 5,
    });
  }, [contractRes?.data?.data, paymentTermsQuery.data?.data, termTypesQuery.data?.data, reset]);

  const typeOptions = React.useMemo(
    () =>
      Array.isArray(typesQuery.data?.data)
        ? typesQuery.data.data.map((t) => ({ label: t.name, value: t._id }))
        : [],
    [typesQuery.data?.data],
  );
  const paymentTermOptions = React.useMemo(
    () =>
      Array.isArray(paymentTermsQuery.data?.data)
        ? paymentTermsQuery.data.data.map((t) => ({
            label: t.name,
            value: t._id,
          }))
        : [],
    [paymentTermsQuery.data?.data],
  );
  const termTypeOptions = React.useMemo(
    () =>
      Array.isArray(termTypesQuery.data?.data)
        ? termTypesQuery.data.data.map((t) => ({ label: t.name, value: t._id }))
        : [],
    [termTypesQuery.data?.data],
  );
  const { data: projectsData } = useProjectsList({ limit: 50, page: 1 });
  const projectOptions = React.useMemo(
    () =>
      Array.isArray(projectsData?.data)
        ? projectsData.data.map((p) => ({ label: p.name, value: p._id }))
        : [],
    [projectsData?.data],
  );
  const awardedOptions = React.useMemo(
    () =>
      Array.isArray(awardedQuery.data?.data)
        ? awardedQuery.data.data.map((a) => ({
            label: `${a.name} — ${a.vendor.name}`,
            value: a._id,
            vendorEmail: a.vendor.email,
            vendorId: a.vendor._id,
          }))
        : [],
    [awardedQuery.data?.data],
  );

  const mutation = useMutation({
    mutationKey: ["contractManager", "contracts", "update", contractId],
    mutationFn: async (payload: any) => {
      const res = await putRequest({
        url: `/contract/manager/contracts/${contractId}`,
        payload,
      });
      return res.data as { status: number; message: string; data: ContractDetail };
    },
    onSuccess: (res) => {
      success("Contract updated successfully", res.message);
      qc.invalidateQueries({ queryKey: ["contract-manager-contracts"] });
      onOpenChange(false);
      if (onUpdated && res?.data) onUpdated(res.data);
      setLastError(null);
      setLastPayload(null);
    },
    onError: (e: ApiResponseError) => {
      setLastError(e);
      error("Failed to update contract", e);
    },
  });

  const buildPayload = React.useCallback((data: yup.InferType<typeof createSchema>) => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const relationship =
      data.relationship === "msa"
        ? "msa_project"
        : data.relationship === "standalone"
          ? "standalone"
          : "project";

    const holdBackRaw =
      typeof data.holdback === "string" && data.holdback.trim().endsWith("%")
        ? data.holdback.replace("%", "")
        : data.holdback;
    const holdBack = toNumberOrUndefined(holdBackRaw);

    let paymentStructureEnum = undefined;
    if (data.paymentStructure === "monthly") paymentStructureEnum = "Monthly";
    if (data.paymentStructure === "milestone") paymentStructureEnum = "Milestone";
    if (data.paymentStructure === "lump_sum") paymentStructureEnum = "Progress Draw";

    const approvers =
      (data.approvalGroups ?? []).flatMap((g) => {
        const lvl = g.approvalLevel ? Number(g.approvalLevel) : undefined;
        const amountValue = toNumberOrUndefined(g.amount);
        const userIds = (g.approvers ?? [])
          .map((u: any) => u?.value ?? u)
          .filter(Boolean);
        return {
          user: userIds,
          groupName: g.name,
          level: lvl,
          amount: amountValue,
        };
      }) ?? [];

    const milestone =
      data.paymentStructure === "milestone"
        ? (data.milestones ?? []).map((m) => {
            const amount = toNumberOrUndefined(m.amount);
            const dueDate = m.dueDate
              ? format(m.dueDate, "yyyy-MM-dd'T'HH:mm:ss")
              : undefined;
            const deliverableName =
              typeof m.deliverable === "string" ? m.deliverable.trim() : "";
            return {
              ...(amount !== undefined ? { amount } : {}),
              dueDate,
              name: m.name,
              ...(deliverableName
                ? {
                    deliverable: {
                      name: deliverableName,
                      ...(dueDate ? { dueDate } : {}),
                    },
                  }
                : {}),
            };
          })
        : undefined;

    const deliverables =
      (data.deliverables ?? []).map((d) => ({
        name: d.name,
        dueDate: d.dueDate ? format(d.dueDate, "yyyy-MM-dd'T'HH:mm:ss") : undefined,
      })) ?? [];

    const paymentTermName = paymentTermsQuery.data?.data?.find(
      (t) => t._id === data.paymentTerm,
    )?.name;
    const termTypeName = termTypesQuery.data?.data?.find(
      (t) => t._id === data.termType,
    )?.name;

    const files =
      (data.documents ?? [])
        .map((f: any) => ({
          name: typeof f?.name === "string" ? f.name : undefined,
          url: typeof f?.url === "string" ? f.url : undefined,
          type: typeof f?.type === "string" ? f.type : undefined,
          size:
            typeof f?.size === "number"
              ? f.size
              : toNumberOrUndefined(f?.size),
        }))
        .filter((f) => Boolean(f?.name && f?.url && f?.type)) ?? [];

    const formatDate = (d: any) => (d ? format(d, "yyyy-MM-dd'T'HH:mm:ss") : undefined);

    const mainSecurityAmount = toNumberOrUndefined(data.securityAmount);
    const mainSecurityDueDate = data.securityDueDate ? formatDate(data.securityDueDate) : undefined;
    const mainSecurity = data.securityType
      ? [
          {
            securityType: data.securityType,
            ...(mainSecurityAmount !== undefined ? { amount: mainSecurityAmount } : {}),
            dueDate: mainSecurityDueDate,
          },
        ]
      : [];
    const extraSecurities = (data.securities || []).map((s) => {
      const amount = toNumberOrUndefined(s.amount);
      return {
        securityType: s.type,
        ...(amount !== undefined ? { amount } : {}),
        dueDate: s.dueDate ? formatDate(s.dueDate) : undefined,
      };
    });

    const insurancePayload = {
      insurance: data.contractSecurity === "yes" ? "Yes" : "No",
      contractSecurity: data.contractSecurity === "yes",
      expiryDate: data.insuranceExpiryDate ? formatDate(data.insuranceExpiryDate) : undefined,
      contractSecurityType: [...mainSecurity, ...extraSecurities],
      policy: (data.insurancePolicies || []).map((p) => ({
        policyName: p.name,
        limit: p.limit,
      })),
    };

    const contractFormationStage = {
      draft: {
        startDate: formatDate(data.draftStartDate),
        endDate: formatDate(data.draftEndDate),
      },
      review: {
        startDate: formatDate(data.reviewStartDate),
        endDate: formatDate(data.reviewEndDate),
      },
      approval: {
        startDate: formatDate(data.approvalStartDate),
        endDate: formatDate(data.approvalEndDate),
      },
      execution: {
        startDate: formatDate(data.executionStartDate),
        endDate: formatDate(data.executionEndDate),
      },
    };

    const payload = {
      title: data.name,
      description: data.description,
      category: data.category,
      timezone: tz,
      contractType: data.type,
      contractRelationship: relationship,
      businessDivision: data.businessDivision,
      projectId: relationship === "project" ? data.project || undefined : undefined,
      msaContractId: relationship === "msa_project" ? data.project || undefined : undefined,
      solicitationId: data.awardedSolicitation || undefined,
      contractId: data.contractId || undefined,
      jobTitle: data.jobTitle || undefined,
      visibility: data.visibility || "private",
      contractAmount:
        typeof data.contractValue === "number"
          ? Number.isFinite(data.contractValue)
            ? data.contractValue
            : undefined
          : toNumberOrUndefined(data.contractValue),
      contigency: data.contingency || undefined,
      holdBack,
      contractPaymentTerm: data.paymentTerm || undefined,
      paymentTerm: paymentTermName || undefined,
      paymentStructure: paymentStructureEnum,
      startDate: formatDate(data.effectiveDate),
      endDate: formatDate(data.endDate),
      duration: data.duration ? Number(data.duration) : undefined,
      contractTermType: data.termType || undefined,
      termType: termTypeName || undefined,
      deliverables,
      milestone,
      files,
      insurance: insurancePayload,
      contractFormationStage,
      rating: data.rating || 5,
      status: "publish",
      approvers,
    };

    Object.keys(payload).forEach((k) => {
      if ((payload as any)[k] === undefined) {
        delete (payload as any)[k];
      }
    });
    return payload;
  }, [paymentTermsQuery.data?.data, termTypesQuery.data?.data]);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const vals = getValues();
        const payload = buildPayload(vals as yup.InferType<typeof createSchema>);
        setLastPayload(payload);
        mutation.mutate(payload);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, getValues, buildPayload, mutation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "rounded-2xl p-0 max-h-[90vh] overflow-y-auto",
          step === 8 ? "sm:max-w-5xl" : "sm:max-w-xl",
        )}
      >
        <div data-testid="edit-contract-sheet" className="space-y-6">
          <div className="px-8 pt-8">
            <p className="text-xl font-semibold text-slate-900">Edit Contract</p>
          </div>
          {lastError && (
            <div className="mx-8 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Failed to update.{" "}
              <button
                aria-label="Retry update"
                className="ml-2 underline text-red-800"
                onClick={() => {
                  if (lastPayload) mutation.mutate(lastPayload);
                }}
              >
                Retry
              </button>
            </div>
          )}
          <div className="px-4 pb-8">
            <p className="text-sm font-medium text-slate-700">
              {STEP_TITLES[step - 1]}
            </p>
            <Forge control={control} onSubmit={(data) => {
              const payload = buildPayload(data as any);
              setLastPayload(payload);
              mutation.mutate(payload);
            }} className="mt-4 space-y-6">
              {step === 1 && (
                <Step1BasicInfo
                  typeOptions={typeOptions}
                  projectOptions={projectOptions}
                  awardedOptions={awardedOptions}
                />
              )}
              {step === 2 && (
                <Step2ContractTeam
                  internalStakeholderOptions={
                    Array.isArray(personnelQuery.data?.data)
                      ? personnelQuery.data.data.map((p) => ({
                          label: p.email || p.name,
                          value: p.email || p._id,
                        }))
                      : []
                  }
                />
              )}
              {step === 5 && (
                <Step3ValuePayments
                  control={control}
                  paymentTermOptions={paymentTermOptions}
                />
              )}
              {step === 3 && (
                <Step4Timeline
                  control={control}
                  termTypeOptions={termTypeOptions}
                />
              )}
              {step === 4 && <Step5Deliverables control={control} />}
              {step === 6 && <Step6ComplianceSecurity control={control} />}
              {step === 7 && (
                <Step4Form
                  control={control}
                  documents={useWatch({ control, name: "documents" }) as any[]}
                />
              )}
              {step === 8 && <Step7ApprovalLevel control={control} />}
              {step === 9 && <Step8ReviewPublish control={control} />}
              {step === 1 ? (
                <div className="flex w-full gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Cancel edit"
                    className="w-full h-12 rounded-xl"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    aria-label="Continue"
                    className="w-full h-12 rounded-xl"
                    onClick={() => setStep(2)}
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="flex w-full gap-4 pt-4 justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    aria-label="Save changes"
                    className=" h-12 rounded-xl"
                    onClick={() => {
                      const vals = getValues();
                      const payload = buildPayload(vals as any);
                      setLastPayload(payload);
                      mutation.mutate(payload);
                    }}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-24 h-12 rounded-xl bg-slate-300"
                      onClick={() => setStep(Math.max(1, step - 1))}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="w-32 h-12 rounded-xl"
                      onClick={() => setStep(Math.min(9, step + 1))}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </Forge>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditContract;
