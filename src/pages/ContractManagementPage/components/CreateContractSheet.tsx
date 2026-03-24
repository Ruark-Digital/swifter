/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { cn } from "@/lib/utils";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2ContractTeam from "./Step2ContractTeam";
import Step3ValuePayments from "./Step3ValuePayments";
import Step4Timeline from "./Step4Timeline";
import Step5Deliverables from "./Step5Deliverables";
import Step4Form from "@/pages/SolicitationManagementPage/components/Step4Form";
import Step7ApprovalLevel from "./Step7ApprovalLevel";
import Step8ReviewPublish from "./Step6ReviewPublish";
import Step6ComplianceSecurity from "./Step6ComplianceSecurity";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useProjectsList } from "@/pages/ProjectManagementPage/services/useProjectApi";
import { useToastHandler } from "@/hooks/useToaster";
import { useWatch } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { format } from "date-fns";
import { useClearSession } from "@/store/solicitationFileSlice";
import { pruneEmptyValuesDeep } from "@/lib/pruneEmptyValuesDeep";
import {
  isEmailLike,
  isObjectIdLike,
  toIdStringOrUndefined,
  toPersonnelOrUndefined,
} from "@/lib/contractFormValues";

type Props = {
  trigger: React.ReactNode;
};

export const schema = yup.object({
  name: yup.string().required("Contract name is required"),
  relationship: yup.string().required("Relationship is required"),
  project: yup.string().optional(),
  awardedSolicitation: yup.string().optional(),
  type: yup.string().required("Contract type is required"),
  category: yup.string().required("Category is required"),
  manager: yup.string().optional(),
  jobTitle: yup.string().optional(),
  businessDivision: yup.string().required("Business Division is required"),
  contractId: yup.string().optional(),
  description: yup.string().required("Description is required"),
  vendor: yup
    .string()
    .optional()
    .test(
      "vendor-id-or-email",
      "Vendor must be an existing vendor or a valid email address",
      (value) => {
        const trimmed = typeof value === "string" ? value.trim() : "";
        if (!trimmed) return true;
        const isObjectId = /^[a-f\d]{24}$/i.test(trimmed);
        const isEmail = /.+@.+\..+/.test(trimmed);
        return isObjectId || isEmail;
      },
    ),
  personnel: yup.array().optional(),
  internalTeam: yup.array().optional(),
  personnelMeta: yup
    .array(
      yup.object({
        id: yup.string().optional(),
        name: yup.string().optional(),
        email: yup.string().optional(),
        role: yup.string().optional(),
        phone: yup.string().optional(),
      }),
    )
    .optional(),
  internalTeamMeta: yup
    .array(
      yup.object({
        id: yup.string().optional(),
        name: yup.string().optional(),
        email: yup.string().optional(),
        role: yup.string().optional(),
        phone: yup.string().optional(),
      }),
    )
    .optional(),
  visibility: yup.string().optional(),
  contractValue: yup.mixed().optional(),
  contingency: yup.string().optional(),
  holdback: yup.string().optional(),
  paymentStructure: yup.string().optional(),
  paymentTerm: yup.string().optional(),
  milestones: yup
    .array(
      yup.object({
        name: yup.string().optional(),
        amount: yup.mixed().optional(),
        dueDate: yup.date().optional(),
        deliverable: yup.string().optional(),
      }),
    )
    .optional(),
  effectiveDate: yup
    .date()
    .typeError("Invalid date")
    .required("Effective date is required"),
  endDate: yup
    .date()
    .typeError("Invalid date")
    .required("End date is required")
    .test(
      "end-after-start",
      "End date must be on or after the effective date",
      function (value) {
        const { effectiveDate } = this.parent as { effectiveDate?: Date };
        if (!value || !effectiveDate) return true;
        return value >= effectiveDate;
      },
    ),
  duration: yup.string().optional(),
  termType: yup.string().optional(),
  documents: yup.array().optional(),
  deliverables: yup
    .array(
      yup.object({
        name: yup.string().optional(),
        dueDate: yup.date().optional(),
      }),
    )
    .optional(),
  draftStartDate: yup.date().optional(),
  draftEndDate: yup.date().optional(),
  reviewStartDate: yup.date().optional(),
  reviewEndDate: yup.date().optional(),
  approvalStartDate: yup.date().optional(),
  approvalEndDate: yup.date().optional(),
  executionStartDate: yup.date().optional(),
  executionEndDate: yup.date().optional(),
  approvalGroups: yup
    .array(
      yup.object({
        name: yup.string().optional(),
        approvers: yup.array().optional(),
        approvalLevel: yup.string().optional(),
        amount: yup.mixed().optional(),
      }),
    )
    .optional(),
  insuranceExpiryDate: yup.date().optional(),
  contractSecurity: yup.string().optional(),
  securityType: yup.string().optional(),
  securityAmount: yup.string().optional(),
  securityDueDate: yup.date().optional(),
  securityExpiryDate: yup.date().optional(),
  rating: yup.number().min(1).max(10).required(),
  insurancePolicies: yup
    .array(
      yup.object({
        name: yup.string().optional(),
        limit: yup.string().optional(),
      }),
    )
    .optional(),
  securities: yup
    .array(
      yup.object({
        type: yup.string().optional(),
        amount: yup.mixed().optional(),
        dueDate: yup.date().optional(),
      }),
    )
    .optional(),
});

export type CreateContractFormData = yup.InferType<typeof schema>;

export const defaultValues = {
  name: "",
  relationship: "",
  project: "",
  awardedSolicitation: "",
  type: "",
  category: "",
  manager: "",
  jobTitle: "",
  businessDivision: "",
  contractId: "",
  description: "",
  vendor: "",
  personnel: [],
  internalTeam: [],
  personnelMeta: [],
  internalTeamMeta: [],
  visibility: "",
  contractValue: "",
  contingency: "",
  holdback: "",
  paymentStructure: "",
  paymentTerm: "",
  milestones: [{ name: "", amount: "", dueDate: undefined, deliverable: "" }],
  effectiveDate: undefined,
  endDate: undefined,
  duration: "",
  termType: "",
  documents: [],
  deliverables: [
    {
      name: "",
      dueDate: undefined,
    },
  ],
  draftStartDate: undefined,
  draftEndDate: undefined,
  reviewStartDate: undefined,
  reviewEndDate: undefined,
  approvalStartDate: undefined,
  approvalEndDate: undefined,
  executionStartDate: undefined,
  executionEndDate: undefined,
  approvalGroups: [{ name: "", approvers: [], approvalLevel: "0", amount: "" }],
  insuranceExpiryDate: undefined,
  contractSecurity: "",
  securityType: "",
  securityAmount: "",
  securityDueDate: undefined,
  securityExpiryDate: undefined,
  insurancePolicies: [{ name: "", limit: "" }],
  securities: [],
};

// Contract metadata: types, payment terms, term types, personnel, awarded solicitation
type ApiListResponse<T> = { status: number; message: string; data: T[] };
type ContractType = { _id: string; name: string; description?: string };
type ContractTerm = { _id: string; name: string; description?: string };
// type Personnel = { _id: string; name: string; email: string };
type AwardedVendorItem = {
  _id: string;
  name: string;
  vendor: { _id: string; name: string; email: string };
};

const STEP_TITLES = [
  "Step 1 of 9: Basic Information",
  "Step 2 of 9: Contract Team",
  "Step 3 of 9: Timeline",
  "Step 4 of 9: Deliverables",
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
      // Deduplicate by key
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
              <p className="text-xl font-semibold text-slate-900">
                Send for Approval
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">
                Select Approvers For Contract Execution
              </p>
              <div className="relative">
                <select
                  className="w-full h-12 border border-gray-300 rounded-lg px-4 pr-10 text-sm text-slate-700 focus:border-[#2A4467] focus:ring-[#2A4467]"
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

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_160px_140px] bg-slate-50 px-6 py-2 text-sm font-semibold text-[#2A4467]">
                <p>Group</p>
                <p className="text-center">Role</p>
                <p className="text-center">Action</p>
              </div>
              <div className="divide-y divide-gray-300">
                {selectedApprovers.length === 0 && (
                  <div className="px-6 py-6 text-sm text-slate-500">
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
                        <p className="text-sm font-semibold text-slate-700">
                          {name}
                        </p>
                        {email && (
                          <p className="text-xs text-blue-600 ">{email}</p>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 text-center">
                        {role}
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        <Checkbox
                          checked={assignedApproverIds.includes(approverId)}
                          onCheckedChange={(checked) =>
                            toggleApprover(approverId, Boolean(checked))
                          }
                        />
                        <span className="text-sm text-slate-700">Assign</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">
                Assigned Approvers
              </p>
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-slate-50 px-4 py-4">
                {assignedApprovers.length === 0 && (
                  <p className="text-sm text-slate-500">Search</p>
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
                      className="flex items-center gap-2 rounded-md bg-[#2A44671A] px-2 py-1 text-xs font-semibold text-[#2A4467]"
                    >
                      <span>{name}</span>
                      <button
                        type="button"
                        onClick={() => toggleApprover(approverId, false)}
                        className="text-[#2A4467]"
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

const CreateContractSheet: React.FC<Props> = ({ trigger }) => {
  const { control, getValues, reset, trigger: formTrigger } = useForge<CreateContractFormData>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const [step, setStep] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const [signatories, setSignatories] = React.useState<string[]>([]);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = React.useState(false);

  const totalSteps = STEP_TITLES.length;
  const handleSendForApproval = React.useCallback((sigs: string[]) => {
    setSignatories(sigs);
    setStep(9);
  }, []);

  const qc = useQueryClient();
  const clearSession = useClearSession();
  const { success, error } = useToastHandler();

  const typesQuery = useQuery<ApiListResponse<ContractType>>({
    queryKey: useUserQueryKey(["contract-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/types" });
      return res.data as ApiListResponse<ContractType>;
    },
    staleTime: 60_000,
  });

  const paymentTermsQuery = useQuery<ApiListResponse<ContractTerm>>({
    queryKey: useUserQueryKey(["contract-payment-terms"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/payment-terms" });
      return res.data as ApiListResponse<ContractTerm>;
    },
    staleTime: 60_000,
  });

  const termTypesQuery = useQuery<ApiListResponse<ContractTerm>>({
    queryKey: useUserQueryKey(["contract-term-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/terms" });
      return res.data as ApiListResponse<ContractTerm>;
    },
    staleTime: 60_000,
  });

  const awardedQuery = useQuery<ApiListResponse<AwardedVendorItem>>({
    queryKey: useUserQueryKey(["awarded-solicitations"]),
    queryFn: async () => {
      const res = await getRequest({
        url: "/contract/manager/awarded-solicitation",
      });
      return res.data as ApiListResponse<AwardedVendorItem>;
    },
    staleTime: 60_000,
  });

  // Projects list (reuse existing service)
  const { data: projectsData } = useProjectsList({ limit: 50, page: 1 });

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
    mutationFn: async (payload: any) => {
      const res = await postRequest({
        url: "/contract/manager/contracts",
        payload,
      });
      return res.data as {
        status: number;
        message: string;
        data: { _id: string; title: string };
      };
    },
    onSuccess: (res) => {
      success("Contract Created", res.message);
      qc.invalidateQueries({ queryKey: ["contracts-all"] });
      qc.invalidateQueries({ queryKey: ["contracts-me"] });
      qc.invalidateQueries({ queryKey: ["contracts-stats"] });
      reset(defaultValues);
      setStep(1);
      clearSession();
      setOpen(false);
    },
    onError: (e: any) => {
      error("Failed to create contract", e);
    },
  });

  const STEP_FIELDS: Record<number, Array<keyof CreateContractFormData>> = {
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
      "rating",
      "description",
      "businessDivision",
    ],
    2: ["manager", "jobTitle", "vendor", "personnel", "internalTeam", "visibility"],
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

  const buildPayload = React.useCallback(
    (data: CreateContractFormData, status: "draft" | "publish") => {
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

      const paymentStructureIsMilestone = data.paymentStructure === "milestone";

      // Map internal payment structure to API enum
      let paymentStructureEnum = undefined;
      if (data.paymentStructure === "monthly") paymentStructureEnum = "Monthly";
      if (data.paymentStructure === "milestone")
        paymentStructureEnum = "Milestone";
      if (data.paymentStructure === "lump_sum")
        paymentStructureEnum = "Progress Draw";

      const approvers =
        (data.approvalGroups ?? []).flatMap((g, i) => {
          const lvl = g.approvalLevel ? Number(g.approvalLevel) : i + 1;
          const amountValue = toNumberOrUndefined(g.amount);
          // API expects user as array of strings
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

      const milestone = paymentStructureIsMilestone
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

      const awardedMatch = awardedQuery.data?.data?.find(
        (a) => a._id === data.awardedSolicitation,
      );

      const vendorRaw =
        typeof data.vendor === "string" ? data.vendor.trim() : "";
      const vendor =
        (vendorRaw && (isEmailLike(vendorRaw) || isObjectIdLike(vendorRaw))
          ? vendorRaw
          : undefined) ||
        awardedMatch?.vendor?.email ||
        undefined;

      // Insurance Construction
      const mainSecurityAmount = toNumberOrUndefined(data.securityAmount);
      const mainSecurityDueDate = data.securityDueDate
        ? format(data.securityDueDate, "yyyy-MM-dd'T'HH:mm:ss")
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
          dueDate: s.dueDate
            ? format(s.dueDate, "yyyy-MM-dd'T'HH:mm:ss")
            : undefined,
        };
      });

      const insurancePayload = {
        insurance: data.contractSecurity === "yes" ? "Yes" : "No",
        contractSecurity: data.contractSecurity === "yes",
        expiryDate: data.insuranceExpiryDate
          ? format(data.insuranceExpiryDate, "yyyy-MM-dd'T'HH:mm:ss")
          : undefined,
        contractSecurityType: [...mainSecurity, ...extraSecurities],
        policy: (data.insurancePolicies || []).map((p) => ({
          policyName: p.name,
          limit: p.limit,
        })),
      };

      // Dates Construction
      const formatDate = (d: any) =>
        d ? format(d, "yyyy-MM-dd'T'HH:mm:ss") : undefined;

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
        projectId:
          relationship === "project" ? data.project || undefined : undefined,
        msaContractId:
          relationship === "msa_project"
            ? data.project || undefined
            : undefined,
        solicitationId: data.awardedSolicitation || undefined,
        contractId: data.contractId || undefined,
        jobTitle: data.jobTitle || undefined,
        vendor,
        personnel:
          (data.personnelMeta && data.personnelMeta.length > 0
            ? (data.personnelMeta ?? [])
                .map((p: any) => toPersonnelOrUndefined(p))
                .filter(Boolean)
            : (data.personnel ?? [])
                .map((t: any) => toPersonnelOrUndefined(t))
                .filter(Boolean)) ?? undefined,
        internalTeam:
          (data.internalTeamMeta && data.internalTeamMeta.length > 0
            ? (data.internalTeamMeta ?? [])
                .map((p: any) => toIdStringOrUndefined(p))
                .filter(Boolean)
            : (data.internalTeam ?? [])
                .map((t: any) => toIdStringOrUndefined(t?.value ?? t))
                .filter(Boolean)) ?? undefined,
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
        approvers,
        insurance: insurancePayload,
        contractFormationStage,
        rating: data.rating || 5,
        status: status,
        signatories: signatories && signatories.length > 0 ? signatories : undefined,
      };

      return pruneEmptyValuesDeep(payload);
    },
    [
      awardedQuery.data?.data,
      paymentTermsQuery.data?.data,
      termTypesQuery.data?.data,
      signatories,
    ],
  );

  const submit = React.useCallback(
    (
      formData: CreateContractFormData,
      status: "draft" | "publish" = "publish",
    ) => {
      const payload = buildPayload(formData, status);
      mutation.mutate(payload);
    },
    [buildPayload, mutation],
  );

  const resetAndClose = React.useCallback(() => {
    reset(defaultValues);
    setStep(1);
    clearSession();
    setOpen(false);
  }, [reset, clearSession]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        forceMount
        showCloseButton={false}
        className={cn(
          "rounded-2xl p-0 max-h-[90vh] overflow-y-auto",
          step === 8 ? "sm:max-w-5xl" : "sm:max-w-xl",
        )}
      >
        <button
          type="button"
          onClick={resetAndClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-slate-100 data-[state=open]:text-slate-500 dark:ring-offset-slate-950 dark:focus:ring-slate-300 dark:data-[state=open]:bg-slate-800 dark:data-[state=open]:text-slate-400"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <div data-testid="create-contract-sheet" className="space-y-6">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle>Create Contract</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-8">
            <p className="text-sm font-medium text-slate-700">
              {STEP_TITLES[step - 1]}
            </p>

            <Forge
              control={control}
              onSubmit={submit}
              className="mt-4 space-y-6"
              // debug
            >
              {step === 1 && (
                <Step1BasicInfo
                  typeOptions={typeOptions}
                  projectOptions={projectOptions}
                  awardedOptions={awardedOptions}
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

              {step === 7 && <Step4Form control={control} documents={[]} />}

              {step === 8 && <Step7ApprovalLevel control={control} />}

              {step === 9 && <Step8ReviewPublish control={control} />}

              {step === 1 ? (
                <div className="flex w-full gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl"
                    onClick={resetAndClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="w-full h-12 rounded-xl"
                    onClick={async () => {
                      const ok = await validateStep(1);
                      if (ok) {
                        setStep(2);
                      }
                    }}
                  >
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="flex w-full gap-4 pt-4 justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    className=" h-12 rounded-xl"
                    onClick={() => {
                      const vals = getValues();
                      submit(vals as CreateContractFormData);
                    }}
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Saving..." : "Save as Draft"}
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
                    {step < totalSteps ? (
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
                          setStep(Math.min(totalSteps, step + 1));
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          const vals = getValues();
                          submit(vals as CreateContractFormData, "publish");
                        }}
                        className="w-32 h-12 rounded-xl"
                        disabled={mutation.isPending}
                      >
                        {mutation.isPending ? "Publishing..." : "Publish"}
                      </Button>
                    )}
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

export default CreateContractSheet;
