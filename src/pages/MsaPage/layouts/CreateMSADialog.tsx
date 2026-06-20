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
import { X, FileText } from "lucide-react";
import { useWatch, useFormContext } from "react-hook-form";
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
  /** Trigger node for the self-managed (Create) flow. Omit when driving the
   *  dialog in controlled mode via `open`/`onOpenChange` (e.g. a row action). */
  trigger?: React.ReactNode;
  /** When set, the dialog operates in edit mode: prefills the form from
   *  `initialValues` (the loaded MSA) and PUTs to /msa-contracts/{id}
   *  instead of POSTing to create. */
  editingMsaId?: string;
  initialValues?: Record<string, any>;
  /** Controlled open state. When provided, the dialog defers its open state to
   *  the parent (mirrors the EditContract pattern used by the Contracts table). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  // Tracks ids/urls/names of previously-uploaded files the user removed in
  // Step 7. Subtracted from the submitted `files` payload so removals persist.
  removedDocuments: yup.array().of(yup.string().required()).optional(),
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
  removedDocuments: [],
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
  open: controlledOpen,
  onOpenChange,
}) => {
  const isEditing = Boolean(editingMsaId);
  const {
    control,
    reset,
    trigger: formTrigger,
    getValues,
    setValue,
  } = useForge<CreateMsaFormData>({
    resolver: yupResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const [step, setStep] = React.useState(1);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (isControlled) onOpenChange?.(next);
      else setInternalOpen(next);
    },
    [isControlled, onOpenChange],
  );

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

  // `/edit` is form-shaped and may omit `files`; the read-only detail endpoint
  // is authoritative for already-uploaded documents. When opened from a table
  // row (no `initialValues` prop), fetch detail in parallel so Step 7 can
  // surface existing uploads.
  const detailFilesQuery = useQuery({
    queryKey: ["msa-detail-files", editingMsaId],
    queryFn: async () => {
      const res = await getRequest({
        url: `/contract/manager/msa-contracts/${editingMsaId}`,
      });
      return res.data as { data?: { files?: any[] } };
    },
    enabled:
      Boolean(editingMsaId) &&
      open &&
      !Array.isArray((initialValues as any)?.files),
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
    // Compose a display name from name parts — invited users come back with
    // firstName/lastName but no `name`, so the chip would otherwise show the
    // raw email. Name on display, email as fallback (matches Step7ApprovalLevel).
    const displayName = (u: any): string => {
      const full = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
      return (u?.name && String(u.name).trim()) || full || u?.email || "";
    };
    const internalTeamSrc = Array.isArray(iv.internalTeam) ? iv.internalTeam : [];
    const internalTeamArr = internalTeamSrc.map((t: any) => {
      const u = t?.user ?? t;
      const id = u?._id ?? u?.id ?? u?.email ?? "";
      return {
        id,
        text: displayName(u) || id || "",
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
      ? policySrc.map((p: any) => {
          // BE persists policy limit as `value` on the stored doc, but the
          // submit path writes `limit`. Read both so edit pre-fills regardless
          // of which key the /edit endpoint returns.
          const rawLimit = p?.limit ?? p?.value;
          return {
            name: p?.policyName ?? "",
            limit:
              rawLimit !== undefined && rawLimit !== null
                ? String(rawLimit)
                : "",
          };
        })
      : defaultValues.insurancePolicies;
    const securitiesSrc = Array.isArray(ins.contractSecurityType)
      ? ins.contractSecurityType
      : [];
    const securities = securitiesSrc.map((s: any) => ({
      type: s?.securityType ?? "",
      amount: s?.amount ?? "",
      dueDate: s?.dueDate ? new Date(s.dueDate) : undefined,
    }));

    // Step 8 approval groups: BE returns `approvers: [{user: [{user, userRef,
    // status}], level, amount, group}]` (one entry per group). Step8
    // ApprovalLevel is RHF-bound on `approvalGroups.${i}.{name,approvers,
    // amount,approvalLevel}` — so we can pre-fill on edit. Each TextTagInput
    // approver entry needs `{id, text, value, email, meta}` so the chip
    // renders with a name (and the autocomplete dedupe by `value`/`id` works).
    const approvalGroupsSrc = Array.isArray(iv.approvers) ? iv.approvers : [];
    const approverDisplayName = (u: any): string => {
      const full = [u?.firstName, u?.lastName]
        .filter((p) => typeof p === "string" && p.trim())
        .join(" ")
        .trim();
      return (u?.name && String(u.name).trim()) || full || u?.email || "";
    };
    const approvalGroups = approvalGroupsSrc.length
      ? approvalGroupsSrc.map((g: any) => {
          const userEntries = Array.isArray(g?.user) ? g.user : [];
          const approvers = userEntries
            .map((entry: any) => {
              const u =
                entry?.user && typeof entry.user === "object" ? entry.user : entry;
              const email = u?.email ?? "";
              const id = u?._id ?? u?.id ?? email ?? "";
              const text = approverDisplayName(u) || email || id || "";
              return id || email || text
                ? {
                    id,
                    value: id || email,
                    text,
                    email,
                    meta: { email, name: approverDisplayName(u) },
                  }
                : null;
            })
            .filter(Boolean);
          return {
            name: typeof g?.group === "string" ? g.group : "",
            approvers,
            amount:
              g?.amount !== undefined && g?.amount !== null
                ? String(g.amount)
                : "",
            approvalLevel:
              g?.level !== undefined && g?.level !== null
                ? String(g.level)
                : "",
          };
        })
      : defaultValues.approvalGroups;

    // Milestone `deliverable` is stored as a deliverable `_id`, but Step 5's
    // deliverable Select is valued by deliverable *name* (and the submit path
    // matches by name). Build an id→name lookup so the milestone pre-fills.
    const deliverablesList = Array.isArray(iv.deliverables) ? iv.deliverables : [];
    const deliverableNameById = new Map<string, string>(
      deliverablesList
        .filter((d: any) => d && typeof d === "object")
        .map((d: any) => [String(d._id ?? d.id ?? ""), d.name ?? ""]),
    );
    const milestoneDeliverableName = (raw: any, index: number): string => {
      if (raw && typeof raw === "object") return raw.name ?? "";
      const key = String(raw ?? "");
      if (deliverableNameById.has(key))
        return deliverableNameById.get(key) as string;
      // Unresolved ObjectId ref — BE sometimes points milestone.deliverable at
      // a stale embedded sub-doc id that doesn't match deliverables[]._id.
      // Fall back to the deliverable at the same ordinal position so the
      // common 1:1 milestone↔deliverable case pre-fills.
      if (/^[a-f\d]{24}$/i.test(key)) {
        const byIndex = deliverablesList[index];
        if (byIndex && typeof byIndex === "object" && byIndex.name)
          return byIndex.name as string;
        return "";
      }
      return key; // already a name
    };

    const pmUser = iv.projectManager?.user;
    const pmLabel =
      pmUser && typeof pmUser === "object" ? displayName(pmUser).trim() : "";
    setDefaultPmLabel(pmLabel || undefined);

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
      // Stored as `contractTerm` on the record (the term-type ref). Step 3's
      // Select is valued by `_id`, so idOf() matches the loaded option — same
      // convention as `type`/`msaType` in Step 1.
      termType: idOf(iv.contractTerm ?? iv.termType),
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
      // BE stores the label ("Monthly"/"Milestone"/"Progress Draw"); Step 5's
      // Select is valued by the short form ("monthly"/"milestone"/"lump_sum").
      // Reverse the submit-side map so the Select matches — and so the
      // milestone sub-section (gated on `=== "milestone"`) renders on edit.
      paymentStructure:
        iv.paymentStructure === "Milestone"
          ? "milestone"
          : iv.paymentStructure === "Monthly"
            ? "monthly"
            : iv.paymentStructure === "Progress Draw"
              ? "lump_sum"
              : (iv.paymentStructure ?? defaultValues.paymentStructure),
      // Stored as `paymentTerms` (plural) on the record. Step 5's Select is
      // valued by `_id`; idOf() resolves the ref to the matching option.
      paymentTerm: idOf(iv.paymentTerms ?? iv.paymentTerm),
      milestones:
        Array.isArray(iv.milestone) && iv.milestone.length
          ? iv.milestone.map((m: any, i: number) => ({
              name: m?.name ?? "",
              amount: m?.amount ?? "",
              dueDate: m?.dueDate ? new Date(m.dueDate) : undefined,
              deliverable: milestoneDeliverableName(m?.deliverable, i),
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
      // /edit endpoint may omit `files` (or return an empty array) even when
      // the record has uploads — the detail endpoint is authoritative for the
      // file list. Fall back to initialValues (passed from MsaDetailPage) or
      // the detailFilesQuery (when opened from a table row) so already-
      // uploaded docs surface in Step 7 on edit.
      documents: (() => {
        const fetchedFiles = Array.isArray(iv.files) ? iv.files : null;
        if (fetchedFiles && fetchedFiles.length) return fetchedFiles as any;
        const initFiles = (initialValues as any)?.files;
        if (Array.isArray(initFiles) && initFiles.length) return initFiles as any;
        const detailFiles = detailFilesQuery.data?.data?.files;
        if (Array.isArray(detailFiles) && detailFiles.length)
          return detailFiles as any;
        return fetchedFiles ?? null;
      })(),
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
      approvalGroups,
    } as CreateMsaFormData, fetched ? { keepDirtyValues: true } : undefined);

    if (fetched) hydratedFromFetchedRef.current = true;
  }, [
    open,
    isEditing,
    editDetailQuery.data,
    initialValues,
    reset,
    detailFilesQuery.data?.data?.files,
  ]);

  // Late-arriving detail files: when /edit completes before the detail query
  // and contains no `files`, the hydration above locks in a null/empty
  // documents value. Backfill from detail once it lands so Step 7 still shows
  // existing uploads. Skipped when the user has already touched the field
  // (don't stomp dirty edits) or when documents already contains entries.
  React.useEffect(() => {
    if (!open || !isEditing) return;
    const detailFiles = detailFilesQuery.data?.data?.files;
    if (!Array.isArray(detailFiles) || !detailFiles.length) return;
    const current = (getValues("documents") as any[] | null | undefined) ?? null;
    if (Array.isArray(current) && current.length) return;
    setValue("documents", detailFiles as any, { shouldDirty: false });
  }, [open, isEditing, detailFilesQuery.data, getValues, setValue]);

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

      // Compose the final files payload from three sources:
      //  1. Existing BE files (initialValues / detail / edit), minus the ids
      //     the user explicitly removed via Step 7's "Previously uploaded" list.
      //  2. Any plain-object entries in data.documents (form value, BE shape).
      //  3. Newly uploaded File instances (or their uploadedData) added via
      //     Step4Form's dropzone.
      // toFileMetaOrUndefined normalizes the heterogeneous mix; dedupe by url
      // (falls back to name) so existing entries don't double-up.
      const removedSet = new Set(
        Array.isArray(data.removedDocuments) ? data.removedDocuments : [],
      );
      const isRemoved = (f: any): boolean =>
        removedSet.has(f?._id) ||
        removedSet.has(f?.url) ||
        removedSet.has(f?.name);
      const existingBackendFiles = ((initialValues as any)?.files ??
        editDetailQuery.data?.data?.files ??
        detailFilesQuery.data?.data?.files ??
        []) as any[];
      const candidates = [
        ...existingBackendFiles.filter((f: any) => !isRemoved(f)),
        ...((data.documents ?? []) as any[]),
      ];
      const seenKeys = new Set<string>();
      const files = candidates
        .map((f: any) => toFileMetaOrUndefined(f))
        .filter((f): f is NonNullable<typeof f> => Boolean(f))
        .filter((f) => {
          const key = (f as any).url ?? (f as any).name;
          if (!key) return true;
          if (seenKeys.has(key)) return false;
          seenKeys.add(key);
          return true;
        });

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
    [
      signatories,
      initialValues,
      editDetailQuery.data?.data?.files,
      detailFilesQuery.data?.data?.files,
    ],
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
    [clearFileSession, setOpen],
  );

  const handleSendForApproval = React.useCallback((sigs: string[]) => {
    setSignatories(sigs);
    setStep(9);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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
          initialSignatories={
            (editDetailQuery.data?.data?.signatories as any[] | undefined) ??
            (detailFilesQuery.data?.data as any)?.signatories ??
            ((initialValues as any)?.signatories as any[] | undefined)
          }
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
          {step === 7 && (
            <Step7Body
              control={control}
              editFiles={editDetailQuery.data?.data?.files}
              detailFiles={detailFilesQuery.data?.data?.files}
              initialValuesFiles={(initialValues as any)?.files}
            />
          )}
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

// Step 7 wraps the Solicitation/Contract `Step4Form` (file-upload state machine
// for NEW uploads) and renders a self-owned list of previously-uploaded docs
// above it. Step4Form's own init-from-documents-prop path is racy on edit:
// when the parent useWatch returns the hydrated files AFTER Step4Form mounts,
// its sync-back effect runs first with empty `filesWithState` and overwrites
// the form's `documents` to `null`, defeating the init. The dedicated list
// below reads BE files directly (form value → detailFilesQuery → initialValues
// → editDetailQuery) and uses a sibling form field `removedDocuments` to track
// per-id removals, so submit can subtract them from the final files payload.
const Step7Body: React.FC<{
  control: any;
  detailFiles?: any[];
  initialValuesFiles?: any[];
  editFiles?: any[];
}> = ({ control, detailFiles, initialValuesFiles, editFiles }) => {
  const documents = useWatch({ control, name: "documents" }) as any[] | undefined;
  const removed = (useWatch({ control, name: "removedDocuments" }) as
    | string[]
    | undefined) ?? [];

  // Existing files: prefer the form-value array (post-hydration), fall back
  // through every other source so the panel paints even before useWatch
  // returns the hydrated value.
  const sources: any[][] = [
    Array.isArray(documents) ? documents : [],
    Array.isArray(editFiles) ? editFiles : [],
    Array.isArray(detailFiles) ? detailFiles : [],
    Array.isArray(initialValuesFiles) ? initialValuesFiles : [],
  ];
  const firstWithFiles = sources.find((arr) => arr.length > 0) ?? [];
  const existing = firstWithFiles
    .filter((f: any) => f && typeof f === "object" && !(f instanceof File))
    .filter((f: any) => !removed.includes(f?._id ?? f?.url ?? f?.name));

  const { setValue } = useFormContext<CreateMsaFormData>();
  const handleRemove = (id: string) => {
    const next = Array.from(new Set([...removed, id]));
    setValue("removedDocuments" as any, next as any, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      {existing.length > 0 && (
        <div className="space-y-2 px-6 pt-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Previously uploaded
          </p>
          <div className="space-y-2">
            {existing.map((file: any, i: number) => {
              const id = file._id ?? file.url ?? `${file.name}-${i}`;
              const ext = String(file.name ?? "").split(".").pop()?.toUpperCase() ?? "";
              return (
                <div
                  key={id}
                  // Mirror DialogContent's `bg-white dark:bg-slate-950` swap:
                  // semantic surface that auto-flips on theme without relying
                  // on the dark: variant being compiled for these specific
                  // tokens. `bg-secondary` resolves via the project's CSS
                  // theme tokens (light: near-white, dark: dark slate) — same
                  // pattern shadcn primitives use across the app.
                  className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {file.url ? (
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-foreground hover:underline truncate block"
                          title={file.name}
                        >
                          {file.name}
                        </a>
                      ) : (
                        <p
                          className="text-sm font-medium text-foreground truncate"
                          title={file.name}
                        >
                          {file.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {ext}
                        {file.size != null ? ` • ${String(file.size)}` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Step4Form control={control} documents={[]} />
    </div>
  );
};

type SendForApprovalDialogProps = {
  control: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSendForApproval: (signatories: string[]) => void;
  // BE-shaped existing signatories from the edit payload, e.g.
  //   [{ user: "<userId>", userRef: "Invite", level: 3, status: "pending" }]
  // Used to pre-check the approver rows on edit so the user doesn't have to
  // re-assign approvers they already picked.
  initialSignatories?: Array<{ user?: string; level?: number | string }>;
};

const SendForApprovalDialog = React.memo(
  ({
    control,
    open,
    onOpenChange,
    onSendForApproval,
    initialSignatories,
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

    // Pre-fill from existing BE signatories on open (edit mode). Match each
    // BE signatory's `user` id to an approver chip's `id`/`value` so the
    // checkbox is pre-checked AND select the group of the FIRST signatory by
    // matching `approvalLevel`. Runs only on the open→true transition so the
    // user's subsequent manual toggles aren't stomped while the dialog is open.
    const prefilledForOpenRef = React.useRef(false);
    React.useEffect(() => {
      if (!open) {
        prefilledForOpenRef.current = false;
        return;
      }
      if (prefilledForOpenRef.current) return;
      const sigs = Array.isArray(initialSignatories) ? initialSignatories : [];
      if (!sigs.length || !allApprovers.length) return;
      const sigUserIds = new Set(
        sigs
          .map((s) => (typeof s?.user === "string" ? s.user : ""))
          .filter(Boolean),
      );
      const matchingKeys = allApprovers
        .filter(({ approver }) => {
          const candidates = [approver?.id, approver?.value].filter(Boolean);
          return candidates.some((c: any) => sigUserIds.has(String(c)));
        })
        .map(({ key }) => key);
      if (matchingKeys.length) {
        setAssignedApproverIds(matchingKeys);
      }
      const firstLevel = sigs.find((s) => s?.level !== undefined)?.level;
      if (firstLevel !== undefined && Array.isArray(approvalGroups)) {
        const groupIdx = approvalGroups.findIndex(
          (g) => String(g?.approvalLevel ?? "") === String(firstLevel),
        );
        if (groupIdx >= 0) setSelectedApprovalGroup(String(groupIdx));
      }
      prefilledForOpenRef.current = true;
    }, [open, initialSignatories, allApprovers, approvalGroups]);

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
                  className="w-full h-12 border border-gray-300 dark:border-slate-700 rounded-lg px-4 pr-10 text-sm text-slate-700 dark:text-slate-300 dark:bg-slate-900 dark:[color-scheme:dark] focus:border-[#2A4467] focus:ring-[#2A4467]"
                  value={selectedApprovalGroup}
                  onChange={(event) =>
                    setSelectedApprovalGroup(event.target.value)
                  }
                >
                  <option value="" className="dark:bg-slate-900 dark:text-slate-100">Select Group</option>
                  {approvalGroupOptions.map((option) => (
                    <option key={option.value} value={option.value} className="dark:bg-slate-900 dark:text-slate-100">
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
