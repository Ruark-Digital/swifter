import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Forge, useForge } from "@/lib/forge";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest, putRequest } from "@/lib/axiosInstance";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useToastHandler } from "@/hooks/useToaster";
import { format } from "date-fns";
import { pruneEmptyValuesDeep } from "@/lib/pruneEmptyValuesDeep";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { useWatch } from "react-hook-form";
import { useUser } from "@/store/authSlice";
import { getExchangeRate } from "@/lib/currencyUtils";
import {
  toIdStringOrUndefined,
  toPersonnelOrUndefined,
  toFileMetaOrUndefined,
} from "@/lib/contractFormValues";
import { useClearSession } from "@/store/solicitationFileSlice";
import Step1BasicInfo from "../components/Step1BasicInfo";
import Step2ContractTeam from "../components/Step2ContractTeam";
import Step3Timeline from "../components/Step3Timeline";
import Step4Deliverables from "../components/Step4Deliverables";
import Step5ValuePayments from "../components/Step5ValuePayments";
import Step6ComplianceSecurity from "../components/Step6ComplianceSecurity";
import Step4Form from "@/pages/SolicitationManagementPage/components/Step4Form";
import Step8ApprovalLevel from "../components/Step8ApprovalLevel";
import Step9ReviewPublish from "../components/Step9ReviewPublish";

type Props = {
  trigger: React.ReactNode;
  /** When set, the dialog operates in edit mode: prefills the form from
   *  `initialValues` (the loaded MSA) and PUTs to /msa-contracts/{id}
   *  instead of POSTing to create. */
  editingMsaId?: string;
  initialValues?: Record<string, any>;
};

const schema = yup.object({
  name: yup.string().required("MSA name is required"),
  type: yup.string().required("MSA type is required"),
  currency: yup.string().required("Currency is required"),
  manager: yup.string().optional(),
  projectManager: yup.string().optional(),
  jobTitle: yup.string().optional(),
  msaId: yup.string().optional(),
  description: yup.string().optional(),
  rating: yup.number().min(1).max(10).required(),
  businessDivision: yup.string().optional(),
  vendor: yup.string().optional(),
  personnel: yup.array().optional(),
  internalTeam: yup.array().optional(),
  visibility: yup.string().optional(),
  effectiveDate: yup.date().optional(),
  endDate: yup.date().optional(),
  duration: yup.string().optional(),
  termType: yup.string().optional(),
  draftStartDate: yup.date().optional(),
  draftEndDate: yup.date().optional(),
  reviewStartDate: yup.date().optional(),
  reviewEndDate: yup.date().optional(),
  approvalStartDate: yup.date().optional(),
  approvalEndDate: yup.date().optional(),
  executionStartDate: yup.date().optional(),
  executionEndDate: yup.date().optional(),
  deliverables: yup
    .array()
    .of(
      yup.object({
        name: yup.string().optional(),
        dueDate: yup.date().optional(),
      }),
    )
    .optional(),
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
  insuranceExpiryDate: yup.date().optional(),
  contractSecurity: yup.string().optional(),
  securityType: yup.string().optional(),
  securityAmount: yup.string().optional(),
  securityDueDate: yup.date().optional(),
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
  documents: yup.array().nullable().optional(),
  approvalGroupSelection: yup.string().optional(),
  assignedApprovers: yup.array().optional(),
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
});

export type CreateMsaFormData = yup.InferType<typeof schema>;

const defaultValues: CreateMsaFormData = {
  name: "",
  type: "",
  currency: "CAD",
  manager: "",
  projectManager: "",
  jobTitle: "",
  msaId: "",
  description: "",
  rating: 1,
  businessDivision: "",
  vendor: "",
  personnel: [],
  internalTeam: [],
  visibility: "",
  effectiveDate: undefined,
  endDate: undefined,
  duration: "",
  termType: "",
  draftStartDate: undefined,
  draftEndDate: undefined,
  reviewStartDate: undefined,
  reviewEndDate: undefined,
  approvalStartDate: undefined,
  approvalEndDate: undefined,
  executionStartDate: undefined,
  executionEndDate: undefined,
  deliverables: [{ name: "", dueDate: undefined }],
  contractValue: "",
  contingency: "",
  holdback: "",
  paymentStructure: "",
  paymentTerm: "",
  milestones: [{ name: "", amount: "", dueDate: undefined, deliverable: "" }],
  insuranceExpiryDate: undefined,
  contractSecurity: "",
  securityType: "",
  securityAmount: "",
  securityDueDate: undefined,
  insurancePolicies: [{ name: "", limit: "" }],
  securities: [],
  documents: null,
  approvalGroupSelection: "",
  assignedApprovers: [],
  approvalGroups: [{ name: "", approvers: [], approvalLevel: "0", amount: "" }],
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

const CreateMSADialog: React.FC<Props> = ({
  trigger,
  editingMsaId,
  initialValues,
}) => {
  const isEditing = Boolean(editingMsaId);
  const {
    control,
    reset,
    trigger: formTrigger,
    getValues,
  } = useForge<CreateMsaFormData>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const [step, setStep] = React.useState(1);
  const [open, setOpen] = React.useState(false);

  // Fetch the MSA via the dedicated edit endpoint — swagger 2.3.0
  // `GET /manager/msa-contracts/{contractId}/edit` returns "a fully
  // populated MSA contract record with all associated data needed to
  // pre-fill the editing form". That's a different shape from the
  // read-only detail endpoint (more populated relations, the canonical
  // edit-form representation).
  // x-roles: contract_manager, company_admin only.
  const editDetailQuery = useQuery({
    queryKey: ["msa-edit-detail", editingMsaId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/msa-contracts/${editingMsaId}/edit`,
      });
      return res.data as { data?: any };
    },
    enabled: Boolean(editingMsaId) && open,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  // Hydration is two-phase: initialValues from the detail endpoint gives
  // an immediate paint, then the /edit endpoint reload upgrades us to the
  // authoritative form-shaped record. Both passes must run — gating after
  // the first pass would lock in any field the detail endpoint shapes
  // differently from /edit (e.g. an unpopulated `projectManager`). User
  // edits between passes are preserved via `keepDirtyValues: true`.
  const hydratedFromFetchedRef = React.useRef(false);
  const hydratedForRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (editingMsaId !== hydratedForRef.current) {
      hydratedFromFetchedRef.current = false;
      hydratedForRef.current = editingMsaId;
    }
  }, [editingMsaId]);

  // Display label for the saved project manager — sourced from the BE
  // user object so the chip can render the real name even when the
  // vendor's PM list doesn't include this user.
  const [defaultPmLabel, setDefaultPmLabel] = React.useState<
    string | undefined
  >(undefined);

  React.useEffect(() => {
    if (!open) return;
    if (!isEditing) return;

    // Prefer fetched detail; fall back to `initialValues` while the
    // query is still loading so the form fills in immediately. Once
    // fetched arrives, re-hydrate (with keepDirtyValues so in-flight
    // edits aren't stomped) — the /edit endpoint is form-shaped and
    // authoritative.
    const fetched = editDetailQuery.data?.data;
    if (hydratedFromFetchedRef.current) return;
    const iv = (fetched ?? initialValues) as Record<string, any> | undefined;
    if (!iv) return;

    const idOf = (v: any) =>
      typeof v === "object" && v !== null ? (v._id ?? v.id ?? "") : (v ?? "");

    const stage = (iv.contractFormationStage ?? {}) as Record<string, any>;
    const personnelSrc = Array.isArray(iv.personnel)
      ? iv.personnel
      : Array.isArray(iv.vendorPersonnel)
        ? iv.vendorPersonnel
        : [];
    const personnelArr = personnelSrc.map((p: any) => ({
      id: p?._id ?? p?.email ?? "",
      text: p?.name || p?.email || p?._id || "",
      meta: {
        email: p?.email ?? "",
        role: Array.isArray(p?.role)
          ? (p.role[0]?.name ?? "")
          : (typeof p?.role === "string" ? p.role : p?.role?.name ?? ""),
        phone: p?.phone ?? "",
      },
    }));
    const internalTeamSrc = Array.isArray(iv.internalTeam) ? iv.internalTeam : [];
    const internalTeamArr = internalTeamSrc.map((t: any) => {
      const u = t?.user ?? t;
      const id = u?._id ?? u?.id ?? u?.email ?? "";
      return {
        id,
        text: u?.name || u?.email || id || "",
        meta: {
          email: u?.email ?? "",
          role:
            typeof u?.role === "string" ? u.role : (u?.role?.name ?? ""),
          phone: u?.phone ?? "",
        },
      };
    });

    const ins = (iv.insurance ?? {}) as Record<string, any>;
    const policySrc = Array.isArray(ins.policy) ? ins.policy : [];
    const insurancePolicies = policySrc.length
      ? policySrc.map((p: any) => ({
          name: p?.policyName ?? "",
          limit:
            p?.limit !== undefined && p?.limit !== null
              ? String(p.limit)
              : "",
        }))
      : defaultValues.insurancePolicies;
    const securitiesSrc = Array.isArray(ins.contractSecurityType)
      ? ins.contractSecurityType
      : [];
    const securities = securitiesSrc.map((s: any) => ({
      type: s?.securityType ?? "",
      amount: s?.amount ?? "",
      dueDate: s?.dueDate ? new Date(s.dueDate) : undefined,
    }));

    const pmUser = iv.projectManager?.user;
    const pmDisplayName =
      pmUser && typeof pmUser === "object"
        ? (pmUser.name ?? pmUser.email ?? undefined)
        : undefined;
    setDefaultPmLabel(
      typeof pmDisplayName === "string" && pmDisplayName.trim()
        ? pmDisplayName.trim()
        : undefined,
    );

    reset({
      ...defaultValues,
      name: iv.title ?? defaultValues.name,
      type: idOf(iv.msaType),
      currency: iv.currency ?? defaultValues.currency,
      msaId: iv.msaContractId ?? defaultValues.msaId,
      description: iv.description ?? defaultValues.description,
      rating: typeof iv.rating === "number" ? iv.rating : defaultValues.rating,
      businessDivision: idOf(iv.businessDivision),
      vendor:
        typeof iv.vendor === "object"
          ? (iv.vendor?.email ?? iv.vendor?._id ?? "")
          : (iv.vendor ?? ""),
      projectManager: idOf(iv.projectManager?.user ?? iv.projectManager),
      visibility: iv.visibility ?? defaultValues.visibility,
      personnel: personnelArr.length ? personnelArr : defaultValues.personnel,
      internalTeam: internalTeamArr.length
        ? internalTeamArr
        : defaultValues.internalTeam,
      effectiveDate: iv.startDate ? new Date(iv.startDate) : undefined,
      endDate: iv.endDate ? new Date(iv.endDate) : undefined,
      duration:
        typeof iv.duration === "number" ? String(iv.duration) : iv.duration ?? "",
      draftStartDate: stage.draft?.startDate
        ? new Date(stage.draft.startDate)
        : undefined,
      draftEndDate: stage.draft?.endDate
        ? new Date(stage.draft.endDate)
        : undefined,
      reviewStartDate: stage.review?.startDate
        ? new Date(stage.review.startDate)
        : undefined,
      reviewEndDate: stage.review?.endDate
        ? new Date(stage.review.endDate)
        : undefined,
      approvalStartDate: stage.approval?.startDate
        ? new Date(stage.approval.startDate)
        : undefined,
      approvalEndDate: stage.approval?.endDate
        ? new Date(stage.approval.endDate)
        : undefined,
      executionStartDate: stage.execution?.startDate
        ? new Date(stage.execution.startDate)
        : undefined,
      executionEndDate: stage.execution?.endDate
        ? new Date(stage.execution.endDate)
        : undefined,
      contractValue: iv.contractValue ?? defaultValues.contractValue,
      contingency:
        typeof iv.contigency === "string"
          ? iv.contigency
          : (iv.contingency ?? defaultValues.contingency),
      holdback:
        typeof iv.holdBack === "number"
          ? String(iv.holdBack)
          : (iv.holdback ?? defaultValues.holdback),
      paymentStructure: iv.paymentStructure ?? defaultValues.paymentStructure,
      milestones:
        Array.isArray(iv.milestone) && iv.milestone.length
          ? iv.milestone.map((m: any) => ({
              name: m?.name ?? "",
              amount: m?.amount ?? "",
              dueDate: m?.dueDate ? new Date(m.dueDate) : undefined,
              deliverable: idOf(m?.deliverable),
            }))
          : defaultValues.milestones,
      deliverables:
        Array.isArray(iv.deliverables) && iv.deliverables.length
          ? iv.deliverables.map((d: any) =>
              typeof d === "string"
                ? { name: d, dueDate: undefined }
                : {
                    name: d?.name ?? "",
                    dueDate: d?.dueDate ? new Date(d.dueDate) : undefined,
                  },
            )
          : defaultValues.deliverables,
      documents: Array.isArray(iv.files) ? (iv.files as any) : null,
      // Hydrating insurance is load-bearing on edit — without it, Save-as-Draft
      // ships `{insurance: "No", contractSecurity: false}` and BE rejects with
      // "Invalid insurance data" against the existing record.
      contractSecurity:
        ins.contractSecurity === true
          ? "yes"
          : ins.contractSecurity === false
            ? "no"
            : defaultValues.contractSecurity,
      insuranceExpiryDate: ins.expiryDate ? new Date(ins.expiryDate) : undefined,
      insurancePolicies,
      securities,
    } as CreateMsaFormData, fetched ? { keepDirtyValues: true } : undefined);

    if (fetched) hydratedFromFetchedRef.current = true;
  }, [open, isEditing, editDetailQuery.data, initialValues, reset]);

  const [signatories, setSignatories] = React.useState<string[]>([]);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = React.useState(false);
  const qc = useQueryClient();
  const toast = useToastHandler();
  const currentUser = useUser();
  // Step4Form is backed by a persisted Zustand store shared across Solicitation/
  // Contract/MSA/Evaluation wizards. Without clearing it on dialog dismiss,
  // files from a prior wizard ghost into the next one — see QA bug #96.
  const clearFileSession = useClearSession();

  const typesQuery = useQuery({
    queryKey: useUserQueryKey(["contract-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/types" });
      return res.data as { data?: Array<{ _id: string; name: string }> };
    },
    staleTime: 60_000,
  });

  const termTypesQuery = useQuery({
    queryKey: useUserQueryKey(["contract-term-types"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/terms" });
      return res.data as { data?: Array<{ _id: string; name: string }> };
    },
    staleTime: 60_000,
  });

  const paymentTermsQuery = useQuery({
    queryKey: useUserQueryKey(["contract-payment-terms"]),
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/payment-terms" });
      return res.data as { data?: Array<{ _id: string; name: string }> };
    },
    staleTime: 60_000,
  });

  const validateStep = async (currentStep: number) => {
    if (currentStep === 1) {
      const ok = await formTrigger(
        ["name", "type", "currency", "rating"] as any,
        {
          shouldFocus: true,
        },
      );
      return ok;
    }
    return true;
  };

  const typeOptions = React.useMemo(
    () =>
      Array.isArray(typesQuery.data?.data)
        ? typesQuery.data!.data!.map((t) => ({ label: t.name, value: t._id }))
        : [],
    [typesQuery.data],
  );

  const termTypeOptions = React.useMemo(
    () =>
      Array.isArray(termTypesQuery.data?.data)
        ? termTypesQuery.data!.data!.map((t) => ({
            label: t.name,
            value: t._id,
          }))
        : [],
    [termTypesQuery.data],
  );

  const paymentTermOptions = React.useMemo(
    () =>
      Array.isArray(paymentTermsQuery.data?.data)
        ? paymentTermsQuery.data!.data!.map((t) => ({
            label: t.name,
            value: t._id,
          }))
        : [],
    [paymentTermsQuery.data],
  );

  const buildPayload = React.useCallback(
    async (data: CreateMsaFormData, status: "draft" | "publish") => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const toNumberOrUndefined = (value: any) => {
        if (value === null || value === undefined) return undefined;
        if (typeof value === "number")
          return Number.isFinite(value) ? value : undefined;
        if (typeof value !== "string") return undefined;
        const cleaned = value.trim().replace(/[^0-9.]/g, "");
        if (!cleaned) return undefined;
        const num = Number(cleaned);
        return Number.isFinite(num) ? num : undefined;
      };

      const files =
        (data.documents ?? [])
          .map((f: any) => toFileMetaOrUndefined(f))
          .filter(Boolean) ?? [];

      const paymentStructure =
        data.paymentStructure === "milestone"
          ? "Milestone"
          : data.paymentStructure === "monthly"
            ? "Monthly"
            : data.paymentStructure === "lump_sum"
              ? "Progress Draw"
              : undefined;

      const deliverables = Array.isArray(data.deliverables)
        ? data.deliverables
            .filter((d) => d?.name)
            .map((d) => ({
              name: d.name,
              dueDate: d.dueDate
                ? format(d.dueDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
                : undefined,
            }))
        : undefined;

      const milestone =
        data.paymentStructure === "milestone" && Array.isArray(data.milestones)
          ? data.milestones
              .filter(
                (m) => m?.name || m?.amount || m?.dueDate || m?.deliverable,
              )
              .map((m) => ({
                amount: m.amount
                  ? Number(String(m.amount).replace(/[^0-9.]/g, ""))
                  : undefined,
                dueDate: m.dueDate
                  ? format(m.dueDate, "yyyy-MM-dd'T'HH:mm:ss'Z'")
                  : undefined,
                name: m.name,
                deliverable: m.deliverable
                  ? {
                      name: m.deliverable,
                      dueDate: Array.isArray(data.deliverables)
                        ? data.deliverables.find(
                            (d) => d.name === m.deliverable,
                          )?.dueDate
                          ? format(
                              data.deliverables.find(
                                (d) => d.name === m.deliverable,
                              )!.dueDate!,
                              "yyyy-MM-dd'T'HH:mm:ss'Z'",
                            )
                          : undefined
                        : undefined,
                    }
                  : undefined,
              }))
          : undefined;

      const personnel = Array.isArray(data.personnel)
        ? (data.personnel ?? [])
            .map((p: any) => toPersonnelOrUndefined(p))
            .filter(Boolean)
        : undefined;

      const internalTeam = Array.isArray(data.internalTeam)
        ? (data.internalTeam ?? [])
            .map((p: any) => toIdStringOrUndefined(p?.value ?? p))
            .filter(Boolean)
        : undefined;

      const formatDate = (d: any) =>
        d ? format(d, "yyyy-MM-dd'T'HH:mm:ss") : undefined;

      const contractSecurityType =
        data.contractSecurity === "yes"
          ? [
              ...(data.securityType
                ? [
                    {
                      securityType: data.securityType,
                      ...(toNumberOrUndefined(data.securityAmount) !== undefined
                        ? { amount: toNumberOrUndefined(data.securityAmount) }
                        : {}),
                      dueDate: data.securityDueDate
                        ? formatDate(data.securityDueDate)
                        : undefined,
                    },
                  ]
                : []),
              ...(
                (Array.isArray(data.securities) ? data.securities : []) as any[]
              )
                .map((s) => ({
                  securityType: s?.type,
                  ...(toNumberOrUndefined(s?.amount) !== undefined
                    ? { amount: toNumberOrUndefined(s?.amount) }
                    : {}),
                  dueDate: s?.dueDate ? formatDate(s.dueDate) : undefined,
                }))
                .filter(
                  (s) => s.securityType || s.amount !== undefined || s.dueDate,
                ),
            ]
          : [];

      const insurancePayload = {
        insurance: data.contractSecurity === "yes" ? "Yes" : "No",
        contractSecurity: data.contractSecurity === "yes",
        expiryDate: data.insuranceExpiryDate
          ? formatDate(data.insuranceExpiryDate)
          : undefined,
        contractSecurityType,
        policy: Array.isArray(data.insurancePolicies)
          ? (data.insurancePolicies ?? [])
              .map((p) => ({
                policyName: p?.name,
                limit: toNumberOrUndefined(p?.limit),
              }))
              .filter((p) => p.policyName || p.limit !== undefined)
          : [],
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

      const approvers =
        (data.approvalGroups ?? [])
          .filter((item) => item.name && item.approvers?.length)
          .flatMap((g, i) => {
            const rawLvl = g.approvalLevel ? Number(g.approvalLevel) : i + 1;
            // DTO: level is z.number().int().min(1).max(5); the form default
            // is "0" which would fail validation.
            const lvl = Math.min(5, Math.max(1, Math.trunc(rawLvl) || i + 1));
            // DTO: amount is z.number() (required inside the item). Missing
            // amount would prune away and trip strict-mode rejection.
            const amountValue = toNumberOrUndefined(g.amount) ?? 0;
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

      const payload = {
        title: data.name,
        msaType: data.type,
        currency: data.currency,
        msaContractId: data.msaId || undefined,
        description: data.description,
        jobTitle: data.jobTitle,
        projectManager: data.projectManager || undefined,
        vendor: (() => {
          const vendorRaw =
            typeof data.vendor === "string" ? data.vendor.trim() : "";
          if (!vendorRaw) return undefined;
          const isObjectId = /^[a-f\d]{24}$/i.test(vendorRaw);
          const isEmail = /.+@.+\..+/.test(vendorRaw);
          return isObjectId || isEmail ? vendorRaw : undefined;
        })(),
        businessDivision: data.businessDivision,
        rating: data.rating,
        timezone: tz,
        contractAmount: data.contractValue
          ? Number(String(data.contractValue).replace(/[^0-9.]/g, ""))
          : undefined,
        contingency:
          data.contingency === null || data.contingency === undefined
            ? undefined
            : typeof data.contingency === "string"
              ? data.contingency
              : String(data.contingency),
        holdBack:
          typeof data.holdback === "number"
            ? Number.isFinite(data.holdback)
              ? data.holdback
              : undefined
            : toNumberOrUndefined(data.holdback),
        paymentStructure,
        paymentTerm: data.paymentTerm || undefined,
        startDate: data.effectiveDate
          ? formatDate(data.effectiveDate)
          : undefined,
        endDate: data.endDate ? formatDate(data.endDate) : undefined,
        duration: data.duration
          ? Number(String(data.duration).replace(/[^0-9.]/g, ""))
          : undefined,
        termType: data.termType || undefined,
        deliverables,
        milestone,
        personnel,
        internalTeam,
        visibility: data.visibility,
        insurance: insurancePayload,
        contractFormationStage,
        approvers,
        signatories:
          signatories && signatories.length > 0 ? signatories : undefined,
        status,
        files,
      };

      return pruneEmptyValuesDeep(payload);
    },
    [signatories],
  );

  const createMutation = useMutation({
    mutationKey: ["create-msa", editingMsaId ?? "new"],
    mutationFn: async (payload: any) => {
      if (isEditing && editingMsaId) {
        const res = await putRequest({
          url: `/contract/manager/msa-contracts/${editingMsaId}`,
          payload,
        });
        return res.data;
      }
      const res = await postRequest({
        url: "/contract/manager/msa-contracts",
        payload,
      });
      return res.data;
    },
    onSuccess: () => {
      if (isEditing) {
        toast.success("MSA updated successfully", "Your changes have been saved.");
      } else {
        toast.success("MSA created successfully", "Your MSA has been created.");
      }
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === "msa" && q.queryKey.at(-1) === currentUser?._id,
      });
      if (editingMsaId) {
        qc.invalidateQueries({ queryKey: ["msa-detail", editingMsaId] });
        qc.invalidateQueries({ queryKey: ["msa-edit-detail", editingMsaId] });
        // After a successful save the local form is the new source of
        // truth, but on a subsequent open we want to pull the fresh
        // server copy in case anything was server-derived. Re-arm the
        // hydration guard.
        hydratedFromFetchedRef.current = false;
      }
      clearFileSession();
      setOpen(false);
      setStep(1);
      if (!isEditing) reset(defaultValues);
    },
    onError: (err: any) => {
      toast.error(
        isEditing ? "Failed to update MSA" : "Failed to create MSA",
        err,
      );
    },
  });

  const submitWithStatus = async (
    data: CreateMsaFormData,
    status: "draft" | "publish",
  ) => {
    if (!data.name || !data.type || !data.rating) {
      toast.error(
        "Missing required fields",
        "Please complete required fields before submitting.",
      );
      return;
    }
    const payload = await buildPayload(data, status);
    const baseCurrency = currentUser?.currency;
    const selectedCurrency = (payload as any)?.currency;
    if (
      typeof baseCurrency === "string" &&
      typeof selectedCurrency === "string" &&
      baseCurrency &&
      selectedCurrency &&
      baseCurrency !== selectedCurrency
    ) {
      try {
        (payload as any).currencyRate = await getExchangeRate(
          baseCurrency,
          selectedCurrency,
        );
      } catch (err) {
        toast.error(
          "Failed to create MSA",
          err instanceof Error ? err.message : "Unable to fetch currency rate",
        );
        return;
      }
    }
    await createMutation.mutateAsync(payload);
  };

  const onCancel = () => {
    // In edit mode the form mirrors a real saved record — wiping it on
    // Cancel would discard the user's in-flight edits. Only reset for
    // the create flow. The dialog just closes either way; re-opening
    // re-hydrates from the freshest server detail (hydratedRef gate).
    if (!isEditing) reset(defaultValues);
    clearFileSession();
    setOpen(false);
  };

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) clearFileSession();
      setOpen(nextOpen);
    },
    [clearFileSession],
  );

  const handleSendForApproval = React.useCallback((sigs: string[]) => {
    setSignatories(sigs);
    setStep(9);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "rounded-2xl p-6 gap-6 max-h-[90vh] overflow-y-auto",
          step === 8 ? "sm:max-w-5xl" : "sm:max-w-[580px]",
        )}
      >
        <div className="flex items-start justify-between">
          <DialogHeader className="p-0">
            <DialogTitle className="text-[20px] font-semibold leading-[30px] text-[#0F0F0F] dark:text-slate-100">
              {isEditing ? "Edit MSA" : "Create MSA"}
            </DialogTitle>
          </DialogHeader>
        </div>

        <p className="text-sm font-medium text-[#0F0F0F]">
          {STEP_TITLES[step - 1]}
        </p>

        <SendForApprovalDialog
          control={control}
          open={isApprovalDialogOpen}
          onOpenChange={setIsApprovalDialogOpen}
          onSendForApproval={handleSendForApproval}
        />

        <Forge
          control={control}
          onSubmit={(data) =>
            submitWithStatus(data as CreateMsaFormData, "publish")
          }
          className="space-y-6"
          data-testid="create-msa-dialog"
        >
          {step === 1 && (
            <Step1BasicInfo
              typeOptions={typeOptions}
              isLoadingTypes={typesQuery.isLoading}
            />
          )}
          {step === 2 && <Step2ContractTeam defaultPmLabel={defaultPmLabel} />}
          {step === 3 && (
            <Step3Timeline
              termTypeOptions={termTypeOptions}
              isLoadingTermTypes={termTypesQuery.isLoading}
              control={control}
            />
          )}
          {step === 4 && <Step4Deliverables control={control} />}
          {step === 5 && (
            <Step5ValuePayments
              control={control}
              paymentTermOptions={paymentTermOptions}
              isLoadingPaymentTerms={paymentTermsQuery.isLoading}
            />
          )}
          {step === 6 && <Step6ComplianceSecurity control={control} />}
          {step === 7 && <Step4Form control={control} documents={[]} />}
          {step === 8 && <Step8ApprovalLevel control={control} />}
          {step === 9 && <Step9ReviewPublish control={control} />}

          {step === 1 ? (
            <div className="flex w-full gap-6 pt-2">
              <DialogClose className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl w-full bg-[#F3F4F6] border border-[#E5E7EB] text-[#0F0F0F] hover:bg-[#E5E7EB]"
                  onClick={onCancel}
                  data-testid="cancel-create-msa"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="button"
                className="flex-1 h-12 rounded-xl"
                data-testid="continue-create-msa"
                onClick={async () => {
                  const ok = await validateStep(1);
                  if (ok) setStep(2);
                }}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="flex w-full gap-6 pt-2 justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-xl"
                onClick={() => {
                  const vals = getValues();
                  void submitWithStatus(vals as CreateMsaFormData, "draft");
                }}
                disabled={createMutation.isPending}
              >
                Save as Draft
              </Button>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 px-10 rounded-xl bg-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-600"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
                <Button
                  type={step === 9 ? "submit" : "button"}
                  onClick={async () => {
                    if (step === 9) return;
                    const ok = await validateStep(step);
                    if (!ok) return;
                    if (step === 8) {
                      setIsApprovalDialogOpen(true);
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="h-12 px-10 rounded-xl"
                  disabled={createMutation.isPending}
                  isLoading={createMutation.isPending}
                >
                  {step === 9 ? "Publish" : "Continue"}
                </Button>
              </div>
            </div>
          )}
        </Forge>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMSADialog;

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
                  const rawText =
                    approver?.text ||
                    approver?.name ||
                    approver?.label ||
                    "";
                  const metaEmail =
                    (approver?.meta?.email as string | undefined) ?? "";
                  const fallbackEmail = approver?.email ?? "";
                  const email =
                    metaEmail ||
                    (typeof fallbackEmail === "string" && fallbackEmail.includes("@")
                      ? fallbackEmail
                      : "");
                  const metaName =
                    (approver?.meta?.name as string | undefined) ?? "";
                  const nameFromText = email
                    ? rawText.replace(
                        new RegExp(`\\s*\\(${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)\\s*$`),
                        "",
                      )
                    : rawText;
                  const name =
                    metaName.trim() || nameFromText.trim() || "Unnamed";
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
                  const metaName =
                    (approver?.meta?.name as string | undefined) ?? "";
                  const rawText =
                    approver?.text ||
                    approver?.name ||
                    approver?.label ||
                    "";
                  const metaEmail =
                    (approver?.meta?.email as string | undefined) ?? "";
                  const stripped = metaEmail
                    ? rawText.replace(
                        new RegExp(`\\s*\\(${metaEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)\\s*$`),
                        "",
                      )
                    : rawText;
                  const name = metaName.trim() || stripped.trim() || "Unnamed";
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
