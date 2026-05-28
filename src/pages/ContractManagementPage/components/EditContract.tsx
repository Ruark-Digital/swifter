import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  schema as createSchema,
  defaultValues as createDefaults,
} from "@/pages/ContractManagementPage/components/CreateContractSheet";
import { format } from "date-fns";
import { X } from "lucide-react";
import {
  toApproverUserKeyOrUndefined,
  toFileMetaOrUndefined,
  toIdStringOrUndefined,
} from "@/lib/contractFormValues";

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
    const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)?$/);
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

export type ContractApprovalGroupInput = {
  name?: string | null;
  approvers?: unknown[];
  approvalLevel?: string;
  amount?: unknown;
};

export const buildContractApproversPayload = (
  approvalGroups: ContractApprovalGroupInput[] | undefined,
) => {
  const groups = approvalGroups ?? [];

  return groups
    .map((g, index) => {
      const groupName = typeof g?.name === "string" ? g.name.trim() : "";
      const user = (g?.approvers ?? [])
        .map((u: any) => toApproverUserKeyOrUndefined(u))
        .filter(Boolean) as string[];

      if (!groupName || user.length === 0) return null;

      const parsedLevel = g?.approvalLevel
        ? Number(g.approvalLevel)
        : undefined;
      const level =
        typeof parsedLevel === "number" && Number.isFinite(parsedLevel)
          ? parsedLevel
          : index + 1;

      const amount = toNumberOrUndefined(g?.amount);

      return {
        user,
        groupName,
        level,
        ...(amount !== undefined ? { amount } : {}),
      };
    })
    .filter(Boolean) as Array<{
    user: string[];
    groupName: string;
    level: number;
    amount?: number;
  }>;
};

export const resolveContractSaveStatus = (
  currentStatus: unknown,
): "draft" | "pending_approval" => {
  return currentStatus === "draft" ? "draft" : "pending_approval";
};

const EditContract: React.FC<Props> = ({
  open,
  onOpenChange,
  contractId,
  onUpdated,
}) => {
  const {
    control,
    reset,
    getValues,
    trigger: formTrigger,
  } = useForge<yup.InferType<typeof createSchema>>({
    resolver: yupResolver(createSchema),
    defaultValues: createDefaults,
    mode: "onChange",
    shouldUnregister: false,
  });

  const [step, setStep] = React.useState(1);
  const qc = useQueryClient();
  const { success, error } = useToastHandler();
  const [lastError, setLastError] = React.useState<ApiResponseError | null>(
    null,
  );
  const [lastPayload, setLastPayload] = React.useState<any | null>(null);
  const [signatories, setSignatories] = React.useState<string[]>([]);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = React.useState(false);

  const watchedDocuments = useWatch({ control, name: "documents" }) as any[];

  const typesQuery = useQuery({
    queryKey: useUserQueryKey(["contract-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/types" });
      return res.data as {
        status: number;
        message: string;
        data: { _id: string; name: string }[];
      };
    },
    staleTime: 60_000,
  });

  const paymentTermsQuery = useQuery({
    queryKey: useUserQueryKey(["contract-payment-terms"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/payment-terms" });
      return res.data as {
        status: number;
        message: string;
        data: { _id: string; name: string }[];
      };
    },
    staleTime: 60_000,
  });

  const termTypesQuery = useQuery({
    queryKey: useUserQueryKey(["contract-term-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/terms" });
      return res.data as {
        status: number;
        message: string;
        data: { _id: string; name: string }[];
      };
    },
    staleTime: 60_000,
  });

  const awardedQuery = useQuery({
    queryKey: useUserQueryKey(["awarded-solicitations"]),
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/manager/awarded-solicitation",
      });
      return res.data as {
        status: number;
        message: string;
        data: {
          _id: string;
          name: string;
          vendor: { _id: string; name: string; email: string };
        }[];
      };
    },
    staleTime: 60_000,
  });

  const msaQuery = useQuery({
    queryKey: useUserQueryKey(["msa-contracts-all"]),
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/manager/msa-contracts",
      });
      return res.data as {
        status: number;
        message: string;
        data: {
          contracts: { _id: string; title: string }[];
        };
      };
    },
    staleTime: 60_000,
  });

  // Use the dedicated edit endpoint (swagger 2.3.0) — returns the
  // contract in form-ready shape with all relations populated.
  // Distinct query key (`contract-manager-contract-edit`) so we don't
  // clobber the read-only detail cache used elsewhere.
  const { data: contractRes } = useQuery({
    queryKey: useUserQueryKey(["contract-manager-contract-edit", contractId]),
    queryFn: () => contractManagerApi.getContractForEdit(contractId),
    enabled: !!contractId,
    staleTime: 60_000,
  });

  React.useEffect(() => {
    const contract = contractRes?.data?.data;
    if (!contract) return;
    const relationship = (
      contract.contractRelationship === "msa" ||
      contract.contractRelationship === "msa_project" ||
      contract.contractRelationship === "standalone" ||
      contract.contractRelationship === "project"
        ? contract.contractRelationship
        : "project"
    ) as "msa" | "msa_project" | "standalone" | "project";

    const paymentTerms = paymentTermsQuery.data?.data ?? [];
    const paymentTermKey =
      typeof contract.paymentTerms === "string"
        ? contract.paymentTerms
        : contract.paymentTerms?._id || contract.paymentTerms?.name || "";
    const paymentTermId =
      paymentTerms.find(
        (it) => it._id === paymentTermKey || it.name === paymentTermKey,
      )?._id ||
      (typeof contract.paymentTerms === "string"
        ? contract.paymentTerms
        : (contract.paymentTerms?._id ?? ""));

    const termTypes = termTypesQuery.data?.data ?? [];
    const termTypeKey =
      typeof contract.contractTerm === "string"
        ? contract.contractTerm
        : contract.contractTerm?._id || contract.contractTerm?.name || "";
    const termTypeId =
      termTypes.find((it) => it._id === termTypeKey || it.name === termTypeKey)
        ?._id ||
      (typeof contract.contractTerm === "string"
        ? contract.contractTerm
        : (contract.contractTerm?._id ?? ""));

    const documents =
      (contract.files ?? []).map((f: any) => ({
        _id: f._id,
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
    const selectedDeliverable =
      deliverables.find((d) => Boolean(d.name))?.name ?? "";

    const milestones =
      (contract.milestone ?? []).map((m: any) => {
        // Backend persists the milestone deliverable as
        // `{ name, dueDate }`, but the form's TextSelect expects a
        // plain string (the deliverable's name) — same shape Create
        // emits. Without this unwrap the dropdown rendered blank and
        // on save `typeof m.deliverable === "string"` was false, so
        // the deliverable silently dropped out of the payload.
        const rawDeliverable = m?.deliverable;
        const deliverable =
          typeof rawDeliverable === "string"
            ? rawDeliverable
            : (rawDeliverable?.name ?? "");
        return {
          name: m?.name ?? m?.milestoneName ?? "",
          amount: m?.amount ?? m?.milestoneAmount ?? "",
          dueDate: m?.dueDate ? new Date(m.dueDate) : undefined,
          deliverable,
        };
      }) ?? [];

    const approvalGroups = (contract.approvers ?? []).map((a: any) => ({
      name: a.group,
      approvers: (a.user ?? []).map((u: any, idx: number) => {
        // API shape: { user: { _id, name, email }, userRef, status }.
        // The previous mapping set text to `userRef` (literally the
        // string "User") which is why the chip rendered "User"; and
        // set value to the user OBJECT, breaking id-based lookups.
        const userObj = u?.user && typeof u.user === "object" ? u.user : u;
        const id = userObj?._id ?? userObj?.id ?? userObj?.email ?? "";
        return {
          id,
          value: id,
          text:
            userObj?.name || userObj?.email || id || `Approver ${idx + 1}`,
          meta: {
            email: userObj?.email ?? "",
            role:
              typeof userObj?.role === "string"
                ? userObj.role
                : (userObj?.role?.name ?? ""),
          },
        };
      }),
      approvalLevel: String(a.level ?? 0),
      amount: a.amount ?? "",
    })) ?? [{ name: "", approvers: [], approvalLevel: "0", amount: "" }];

    const insurancePolicies = (contract.insurance?.policy ?? []).map((p) => ({
      name: p.policyName,
      limit: String(p.value ?? ""),
    })) ?? [{ name: "", limit: "" }];

    const securityType =
      contract.insurance?.contractSecurityType?.[0]?.securityType ?? "";
    const securityAmount =
      contract.insurance?.contractSecurityType?.[0]?.amount ?? "";
    const securityDueDate = contract.insurance?.contractSecurityType?.[0]
      ?.dueDate
      ? new Date(
          contract.insurance.contractSecurityType[0]
            .dueDate as unknown as string,
        )
      : undefined;
    const securities =
      (contract.insurance?.contractSecurityType ?? []).slice(1).map((s) => ({
        type: s.securityType,
        amount: s.amount,
        dueDate: s.dueDate ? new Date(s.dueDate) : undefined,
      })) ?? [];

    const payload = {
      ...createDefaults,
      name: contract.title ?? "",
      relationship,
      project:
        typeof contract.project === "string"
          ? contract.project
          : (contract.project?._id ?? ""),
      msaContractId:
        typeof contract.msaContract === "string"
          ? contract.msaContract
          : contract.msaContract?._id || "",
      awardedSolicitation:
        typeof contract.solicitation === "string"
          ? contract.solicitation
          : (contract.solicitation?._id ?? ""),
      type: contract.contractType?._id ?? "",
      // BE detail can return `category` as either the raw string name or
      // a populated `{_id, name}` object — coerce to the string the form
      // expects (TextSelectWithSearch matches options by `value: c.name`).
      category:
        typeof contract.category === "string"
          ? contract.category
          : ((contract.category as any)?.name ?? ""),
      manager: contract.managers?.[0] ?? "",
      jobTitle: contract.jobTitle ?? "",
      vendor:
        typeof contract.vendor === "string"
          ? contract.vendor
          : (contract.vendor?._id ?? ""),
      // Server field name varies — the new /edit endpoint exposes a
      // flat `personnel` array; the older detail shape used
      // `vendorPersonnel`. Accept either.
      personnel: ((contract.personnel as any[] | undefined) ??
        contract.vendorPersonnel ??
        []
      ).map((p: any) => ({
        id: p._id ?? p.email ?? "",
        text: p.name || p.email || p._id || "",
        meta: {
          email: p.email ?? "",
          role: Array.isArray(p.role)
            ? (p.role[0]?.name ?? "")
            : (p.role ?? ""),
          phone: p.phone ?? "",
        },
      })),
      personnelMeta: ((contract.personnel as any[] | undefined) ??
        contract.vendorPersonnel ??
        []
      ).map((p: any) => ({
        id: p._id ?? p.email ?? "",
        name: p.name || "",
        email: p.email ?? "",
        role:
          typeof p.role === "string"
            ? p.role
            : Array.isArray(p.role)
              ? ((p.role[0] as any)?.name ?? "")
              : "",
        phone: p.phone ?? "",
      })),
      internalTeam: (contract.internalTeam ?? []).map((t: any) => {
        const u = t?.user ?? t;
        const role =
          typeof u?.role === "string" ? u.role : (u?.role?.name ?? "");
        const id = u?._id ?? u?.id ?? u?.email ?? "";
        return {
          id,
          text: u?.name || u?.email || id || "",
          meta: {
            email: u?.email ?? "",
            role,
            phone: u?.phone ?? "",
          },
        };
      }),
      internalTeamMeta: (contract.internalTeam ?? []).map((t: any) => {
        const u = t?.user ?? t;
        const role =
          typeof u?.role === "string" ? u.role : (u?.role?.name ?? "");
        return {
          id: u?._id ?? u?.id ?? u?.email ?? "",
          name: u?.name || "",
          email: u?.email ?? "",
          role,
          phone: u?.phone ?? "",
        };
      }),
      businessDivision:
        typeof contract.businessDivision === "string"
          ? contract.businessDivision
          : (contract.businessDivision?._id ?? ""),
      contractId: contract.contractId ?? "",
      description: contract.description ?? "",
      visibility: contract.visibility ?? "",
      // The /edit response carries `currency` and `projectManager` which
      // the previous mapping ignored — the form's Currency select was
      // stuck on "Select currency" and the PM select was unfilled even
      // when both were saved on the contract.
      currency:
        typeof contract.currency === "string"
          ? contract.currency
          : ((contract as any).currency?._id ??
            createDefaults.currency ??
            ""),
      projectManager:
        typeof contract.projectManager === "object" &&
        contract.projectManager !== null
          ? (((contract.projectManager as any).user?._id ??
            (contract.projectManager as any).user) ??
            "")
          : ((contract.projectManager as any) ?? ""),
      contractValue: contract.contractValue ?? "",
      contingency: (contract as any).contingency ?? contract.contigency ?? "",
      holdback: String(contract.holdBack ?? ""),
      paymentStructure:
        contract.paymentStructure === "Monthly"
          ? "monthly"
          : contract.paymentStructure === "Milestone"
            ? "milestone"
            : contract.paymentStructure === "Progress Draw"
              ? "lump_sum"
              : "",
      selectedDeliverable,
      paymentTerm: paymentTermId,
      termType: termTypeId,
      effectiveDate: contract.startDate
        ? new Date(contract.startDate)
        : undefined,
      endDate: contract.endDate ? new Date(contract.endDate) : undefined,
      duration: contract.duration ? String(contract.duration) : "",
      deliverables,
      documents,
      milestones,
      draftStartDate: contract.contractFormationStage?.draft?.startDate
        ? new Date(contract.contractFormationStage.draft.startDate)
        : undefined,
      draftEndDate: contract.contractFormationStage?.draft?.endDate
        ? new Date(contract.contractFormationStage.draft.endDate)
        : undefined,
      reviewStartDate: contract.contractFormationStage?.review?.startDate
        ? new Date(contract.contractFormationStage.review.startDate)
        : undefined,
      reviewEndDate: contract.contractFormationStage?.review?.endDate
        ? new Date(contract.contractFormationStage.review.endDate)
        : undefined,
      approvalStartDate: contract.contractFormationStage?.approval?.startDate
        ? new Date(contract.contractFormationStage.approval.startDate)
        : undefined,
      approvalEndDate: contract.contractFormationStage?.approval?.endDate
        ? new Date(contract.contractFormationStage.approval.endDate)
        : undefined,
      executionStartDate: contract.contractFormationStage?.execution?.startDate
        ? new Date(contract.contractFormationStage.execution.startDate)
        : undefined,
      executionEndDate: contract.contractFormationStage?.execution?.endDate
        ? new Date(contract.contractFormationStage.execution.endDate)
        : undefined,
      approvalGroups,
      insuranceExpiryDate: contract.insurance?.expiryDate
        ? new Date(contract.insurance.expiryDate)
        : undefined,
      contractSecurity: contract.insurance?.contractSecurity ? "yes" : "no",
      securityType,
      securityAmount: String(securityAmount ?? ""),
      securityDueDate,
      insurancePolicies,
      securities,
      rating: contract.rating ?? 5,
    };

    reset(payload, { keepDirtyValues: true });
  }, [
    contractRes?.data?.data,
    paymentTermsQuery.data?.data,
    termTypesQuery.data?.data,
    reset,
  ]);

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

  const msaOptions = React.useMemo(() => {
    const contracts = msaQuery.data?.data?.contracts || [];
    return contracts.map((c: any) => ({
      label: c.title || "Untitled MSA",
      value: c._id,
    }));
  }, [msaQuery.data?.data?.contracts]);

  const mutation = useMutation({
    mutationKey: ["contractManager", "contracts", "update", contractId],
    mutationFn: async (payload: any) => {
      const res = await putRequest({
        url: `/contract/manager/contracts/${contractId}`,
        payload,
      });
      return res.data as {
        status: number;
        message: string;
        data: ContractDetail;
      };
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

  const buildPayload = React.useCallback(
    (data: yup.InferType<typeof createSchema>, status: "draft" | "pending_approval") => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const relationship =
        data.relationship === "msa" || data.relationship === "msa_project"
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
      if (data.paymentStructure === "milestone")
        paymentStructureEnum = "Milestone";
      if (data.paymentStructure === "lump_sum")
        paymentStructureEnum = "Progress Draw";

      const approvers = buildContractApproversPayload(
        data.approvalGroups as ContractApprovalGroupInput[] | undefined,
      );

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
          dueDate: d.dueDate
            ? format(d.dueDate, "yyyy-MM-dd'T'HH:mm:ss")
            : undefined,
        })) ?? [];

      const paymentTermName = paymentTermsQuery.data?.data?.find(
        (t) => t._id === data.paymentTerm,
      )?.name;
      const termTypeName = termTypesQuery.data?.data?.find(
        (t) => t._id === data.termType,
      )?.name;

      const files =
        (data.documents ?? [])
          .map((f: any) => toFileMetaOrUndefined(f))
          .filter(Boolean) ?? [];

      const formatDate = (d: any) =>
        d ? format(d, "yyyy-MM-dd'T'HH:mm:ss") : undefined;

      const mainSecurityAmount = toNumberOrUndefined(data.securityAmount);
      const mainSecurityDueDate = data.securityDueDate
        ? formatDate(data.securityDueDate)
        : undefined;
      const mainSecurity = data.securityType
        ? [
            {
              securityType: data.securityType,
              ...(mainSecurityAmount !== undefined
                ? { amount: mainSecurityAmount }
                : {}),
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
        expiryDate: data.insuranceExpiryDate
          ? formatDate(data.insuranceExpiryDate)
          : undefined,
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
        // Defensive guard: if the initial state leaked through as an object
        // (legacy BE shape), coerce to the string name the API expects.
        category:
          typeof data.category === "string"
            ? data.category
            : ((data.category as any)?.name ?? ""),
        timezone: tz,
        contractType: data.type,
        contractRelationship: relationship,
        businessDivision: data.businessDivision,
        projectId:
          relationship === "project" || relationship === "msa_project"
            ? data.project || undefined
            : undefined,
        msaContractId:
          relationship === "msa_project"
            ? data.msaContractId || undefined
            : undefined,
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
        contingency: data.contingency || undefined,
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
        status,
        approvers,
        internalTeam:
          (data.internalTeamMeta && data.internalTeamMeta.length > 0
            ? (data.internalTeamMeta ?? [])
                .map((p: any) => toIdStringOrUndefined(p))
                .filter(Boolean)
            : (data.internalTeam ?? [])
                .map((t: any) => toIdStringOrUndefined(t?.value ?? t))
                .filter(Boolean)) ?? undefined,
        signatories:
          signatories && signatories.length > 0 ? signatories : undefined,
      };

      Object.keys(payload).forEach((k) => {
        if ((payload as any)[k] === undefined) {
          delete (payload as any)[k];
        }
      });
      return payload;
    },
    [paymentTermsQuery.data?.data, signatories, termTypesQuery.data?.data],
  );

  const STEP_FIELDS: Record<
    number,
    Array<keyof yup.InferType<typeof createSchema>>
  > = {
    1: [
      "name",
      "relationship",
      "project",
      "awardedSolicitation",
      "type",
      "category",
      "manager",
      "jobTitle",
      "contractId",
      "msaContractId",
      "rating",
      "description",
      "businessDivision",
    ],
    2: [
      "manager",
      "jobTitle",
      "vendor",
      "personnel",
      "internalTeam",
      "visibility",
    ],
    3: [
      "effectiveDate",
      "endDate",
      "duration",
      "termType",
      "draftStartDate",
      "draftEndDate",
      "reviewStartDate",
      "reviewEndDate",
      "approvalStartDate",
      "approvalEndDate",
      "executionStartDate",
      "executionEndDate",
    ],
    4: ["deliverables"],
    5: [
      "contractValue",
      "contingency",
      "holdback",
      "paymentStructure",
      "milestones",
      "paymentTerm",
    ],
    6: [
      "insuranceExpiryDate",
      "insurancePolicies",
      "contractSecurity",
      "securityType",
      "securityAmount",
      "securityDueDate",
      "securityExpiryDate",
      "securities",
    ],
    7: ["documents"],
    8: ["approvalGroups"],
  };

  const validateStep = React.useCallback(
    async (currentStep: number) => {
      const fields = STEP_FIELDS[currentStep] ?? [];
      if (!fields.length) return true;
      const ok = await formTrigger(fields as any, { shouldFocus: true });
      return ok;
    },
    [formTrigger],
  );

  const handleSendForApproval = React.useCallback((sigs: string[]) => {
    setSignatories(sigs);
    setStep(9);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        const vals = getValues();
        const status = resolveContractSaveStatus(
          contractRes?.data?.data?.status,
        );
        const payload = buildPayload(
          vals as yup.InferType<typeof createSchema>,
          status,
        );
        setLastPayload(payload);
        mutation.mutate(payload);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    open,
    getValues,
    buildPayload,
    mutation,
    onOpenChange,
    contractRes?.data?.data?.status,
  ]);

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
            <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Edit Contract
            </p>
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
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {STEP_TITLES[step - 1]}
            </p>
            <Forge
              control={control}
              onSubmit={(data) => {
                const payload = buildPayload(data as any, "pending_approval");
                setLastPayload(payload);
                mutation.mutate(payload);
              }}
              className="mt-4 space-y-6"
            >
              {step === 1 && (
                <Step1BasicInfo
                  typeOptions={typeOptions}
                  projectOptions={projectOptions}
                  awardedOptions={awardedOptions}
                  msaOptions={msaOptions}
                />
              )}
              {step === 2 && <Step2ContractTeam />}
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
                <Step4Form control={control} documents={watchedDocuments} />
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
                      const status = resolveContractSaveStatus(
                        contractRes?.data?.data?.status,
                      );
                      const payload = buildPayload(vals as any, status);
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
                      className="w-24 h-12 rounded-xl bg-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-600"
                      onClick={() => setStep(Math.max(1, step - 1))}
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      className="w-32 h-12 rounded-xl"
                      onClick={async () => {
                        const ok = await validateStep(step);
                        if (!ok) return;
                        if (step === 8) {
                          setIsApprovalDialogOpen(true);
                          return;
                        }
                        if (step === 9) {
                          const vals = getValues();
                          const payload = buildPayload(vals as any, "pending_approval");
                          setLastPayload(payload);
                          mutation.mutate(payload);
                          return;
                        }
                        setStep(Math.min(9, step + 1));
                      }}
                      disabled={step === 9 && mutation.isPending}
                    >
                      {step === 9
                        ? mutation.isPending
                          ? "Publishing..."
                          : "Publish"
                        : "Continue"}
                    </Button>
                  </div>
                </div>
              )}
            </Forge>

            <SendForApprovalDialog
              control={control}
              open={isApprovalDialogOpen}
              onOpenChange={setIsApprovalDialogOpen}
              onSendForApproval={handleSendForApproval}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditContract;

type SendForApprovalDialogProps = {
  control: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendForApproval: (signatories: string[]) => void;
};

const SendForApprovalDialog = React.memo(
  ({
    control,
    open,
    onOpenChange,
    onSendForApproval,
  }: SendForApprovalDialogProps) => {
    const approvalGroups = useWatch({ control, name: "approvalGroups" }) as
      | {
          name?: string | null;
          approvers?: any[];
          approvalLevel?: string;
          amount?: unknown;
        }[]
      | undefined;

    const [selectedApprovalGroup, setSelectedApprovalGroup] =
      React.useState("");
    const [assignedApproverIds, setAssignedApproverIds] = React.useState<
      string[]
    >([]);

    // Auto-select the first group that has approvers as soon as the
    // dialog opens, so the approver list isn't a dead empty state
    // until the user manually picks from the dropdown.
    React.useEffect(() => {
      if (!open) return;
      if (selectedApprovalGroup !== "") return;
      const firstWithApprovers = (approvalGroups ?? []).findIndex(
        (g) => (g?.approvers?.length ?? 0) > 0,
      );
      if (firstWithApprovers >= 0) {
        setSelectedApprovalGroup(String(firstWithApprovers));
      }
    }, [open, approvalGroups, selectedApprovalGroup]);

    const approvalGroupOptions = React.useMemo(
      () =>
        (approvalGroups ?? []).map((group, index) => ({
          label: `${group?.name || `Group ${index + 1}`} - Approval Level ${
            group?.approvalLevel || "-"
          }`,
          value: String(index),
        })),
      [approvalGroups],
    );

    const selectedGroupIndex =
      selectedApprovalGroup === "" ? -1 : Number(selectedApprovalGroup);
    const selectedGroup =
      selectedGroupIndex >= 0 && approvalGroups?.length
        ? approvalGroups?.[selectedGroupIndex]
        : undefined;

    const selectedApprovers = React.useMemo(
      () => (selectedGroup?.approvers ?? []) as any[],
      [selectedGroup?.approvers],
    );

    const getApproverKey = React.useCallback(
      (approver: any, index: number) =>
        approver?.id ||
        approver?.email ||
        approver?.value ||
        approver?.text ||
        String(index),
      [],
    );

    const toggleApprover = React.useCallback(
      (approverId: string, checked: boolean) => {
        setAssignedApproverIds((prev) =>
          checked
            ? [...prev, approverId]
            : prev.filter((id) => id !== approverId),
        );
      },
      [],
    );

    const allApprovers = React.useMemo(() => {
      const list = (approvalGroups ?? []).flatMap((group) =>
        (group?.approvers ?? []).map((approver, idx) => ({
          approver,
          key: getApproverKey(approver, idx),
        })),
      );
      const seen = new Set<string>();
      return list.filter(({ key }) => {
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }, [approvalGroups, getApproverKey]);

    const assignedApprovers = React.useMemo(
      () =>
        allApprovers
          .filter(({ key }) => assignedApproverIds.includes(key))
          .map(({ approver }) => approver),
      [allApprovers, assignedApproverIds],
    );

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className=" space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Send for Approval
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Select Approvers For Contract Execution
              </p>
              <div className="relative">
                <select
                  className="w-full h-12 border border-gray-300 dark:border-slate-700 rounded-lg px-4 pr-10 text-sm text-slate-700 dark:text-slate-300 focus:border-[#2A4467] focus:ring-[#2A4467]"
                  value={selectedApprovalGroup}
                  onChange={(event) =>
                    setSelectedApprovalGroup(event.target.value)
                  }
                >
                  <option value="">Select Group</option>
                  {approvalGroupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_160px_140px] bg-slate-50 dark:bg-slate-800/60 px-6 py-2 text-sm font-semibold text-[#2A4467] dark:text-blue-300">
                <p>Group</p>
                <p className="text-center">Role</p>
                <p className="text-center">Action</p>
              </div>
              <div className="divide-y divide-gray-300 dark:divide-slate-700">
                {selectedApprovers.length === 0 && (
                  <div className="px-6 py-6 text-sm text-slate-500 dark:text-slate-400">
                    No approvers added for this group
                  </div>
                )}
                {selectedApprovers.map((approver, index) => {
                  const approverId = getApproverKey(approver, index);
                  const name =
                    approver?.text ||
                    approver?.name ||
                    approver?.label ||
                    "Unnamed";
                  const email = approver?.id || approver?.email || "";
                  const role = approver?.meta?.role
                    ? approver.meta.role
                    : selectedGroup?.approvalLevel
                      ? `Approval Level ${selectedGroup.approvalLevel}`
                      : "Approval";
                  return (
                    <div
                      key={approverId}
                      className="grid grid-cols-[1fr_160px_140px] items-center px-6 py-4"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {name}
                        </p>
                        {email && (
                          <p className="text-xs text-blue-600 ">{email}</p>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                        {role}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Checkbox
                          checked={assignedApproverIds.includes(approverId)}
                          onCheckedChange={(checked) =>
                            toggleApprover(approverId, Boolean(checked))
                          }
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Assign</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Assigned Approvers
              </p>
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-4">
                {assignedApprovers.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Search</p>
                )}
                {assignedApprovers.map((approver, index) => {
                  const approverId = getApproverKey(approver, index);
                  const name =
                    approver?.text ||
                    approver?.name ||
                    approver?.label ||
                    "Unnamed";
                  return (
                    <div
                      key={approverId}
                      className="flex items-center gap-2 rounded-md bg-[#2A44671A] dark:bg-blue-900/30 px-2 py-1 text-xs font-semibold text-[#2A4467] dark:text-blue-300"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => toggleApprover(approverId, false)}
                        className="text-[#2A4467] dark:text-blue-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-6 justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-12 px-8 rounded-xl"
                onClick={() => onOpenChange(false)}
              >
                Back
              </Button>
              <Button
                type="button"
                className="h-12 px-8 rounded-xl bg-[#2A4467] hover:bg-[#1e3252] text-white"
                onClick={() => {
                  const sigs = assignedApprovers
                    .map((approver, index) => {
                      return (
                        approver?.value ||
                        approver?.id ||
                        approver?.email ||
                        getApproverKey(approver, index)
                      );
                    })
                    .filter(Boolean) as string[];
                  onOpenChange(false);
                  onSendForApproval(sigs);
                }}
              >
                Send for Approval
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
);
