import React from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import SendApprovalDialog from "./SendApprovalDialog";
import CreateChangeDialog from "./CreateChangeDialog";
import RequestClaimDialog from "./RequestClaimDialog";
import MessageComposer from "@/pages/SolicitationManagementPage/components/MessageComposer";
import { useUserRole } from "@/hooks/useUserRole";
import { useUser } from "@/store/authSlice";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { DocumentItem, type DocType } from "./DocumentItem";
import {
  formatFileSize,
  getFileIcon,
  getSimpleFileExtension,
} from "@/lib/fileUtils";
import {
  formatChangeOriginLabel,
  getApproveDraftCoUrl,
  getConvertDirectiveUrl,
  getManagerApproveChangeUrl,
  isDraftChangeOrder,
  shouldShowChangeDecisionActions,
  toConvertDirectivePayload,
  toContractChangeFileItem,
  type UploadURLs,
} from "../lib/contractChanges";
import { useChangeLock } from "../hooks/useChangeLock";
import { formatDate } from "date-fns";
import Spinner from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatSecurityType, formatCurrency, formatCompactCurrency, resolveCurrency } from "@/lib/utils";

type Props = {
  trigger?: React.ReactNode;
  contractId: string;
  changeId: string;
  basePath?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  /** When in claim mode (`isClaim`), the manager Send-for-Approval flow
   *  POSTs to `${claimAssignUrl}` to assign approvers. Must include the
   *  claimId. Defaults to the Contract path. */
  claimAssignUrl?: string;
  /** Contract-level currency; falls back to USD when the API omits it. */
  currency?: string;
  /** BE-computed flag: is the logged-in user the contract's owner/manager.
   *  Gates the manager (CM) decision actions (approve/reject a change,
   *  finalize a draft CO, decide a claim) — a manager who doesn't own the
   *  contract can view but not act. Approver/PM decisions are unaffected. */
  owner?: boolean;
};

const LabelRow = ({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) => (
  <div className="space-y-2 py-3">
    <span className="text-sm text-slate-500 dark:text-slate-400 block">{label}</span>
    <span
      className={`text-sm block ${highlight
          ? "font-semibold text-slate-900 dark:text-slate-100"
          : "text-slate-800 dark:text-slate-200"
        }`}
    >
      {value}
    </span>
  </div>
);

const ChangeDetailsSheet: React.FC<Props> = ({
  trigger,
  contractId,
  changeId,
  basePath,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  claimAssignUrl,
  currency,
  owner,
}) => {
  const currencyCode = resolveCurrency(currency, useUser()?.currency);
  const toast = useToastHandler();
  const qc = useQueryClient();
  const { isManager, isApprover, isVendor, isProjectManager, isAdmin, isViewOnly } =
    useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;
  const currentUser = useUser();
  const [internalOpen, setInternalOpen] = React.useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;

  const roleBasePath = React.useMemo(() => {
    if (basePath) return basePath;
    if (isManager) return "/contract/manager/contracts";
    if (isApprover) return "/contract/approver/contracts";
    if (isContractVendorLike) return "/contract/vendor/contracts";
    if (isAdmin || isViewOnly) return "/contract/user/contracts";
    return "/contract/user/contracts";
  }, [basePath, isManager, isApprover, isContractVendorLike, isAdmin, isViewOnly]);

  const isClaim = roleBasePath.includes("/claim");

  const usesListBasePath = React.useMemo(
    () =>
      roleBasePath.endsWith("/changes") ||
      roleBasePath.endsWith("/change") ||
      roleBasePath.endsWith("/claims") ||
      roleBasePath.endsWith("/claim"),
    [roleBasePath],
  );

  // useUserQueryKey appends user._id so the cache stays isolated per
  // logged-in user — without this the next user sees the previous
  // user's claim/change detail until React Query staleTime elapses.
  // (See feedback_user_query_key_invalidation memory: id is appended
  //  to the END of the key — invalidate with the same wrapped key.)
  const changeDetailQueryKey = useUserQueryKey([
    isClaim ? "contract-claim-detail" : "contract-change-detail",
    roleBasePath,
    contractId,
    changeId,
  ]);

  const { data: detailRes, isLoading: isDetailLoading } = useQuery({
    queryKey: changeDetailQueryKey,
    queryFn: async () => {
      const url = usesListBasePath
        ? `${roleBasePath}/${changeId}`
        : isClaim
          ? `${roleBasePath}/${contractId}/claims/${changeId}`
          : `${roleBasePath}/${contractId}/changes/${changeId}`;

      const res = await getRequest({ url });
      return (res as any)?.data;
    },
    enabled: open && !!contractId && !!changeId,
    staleTime: 60_000,
  });

  const detail = (detailRes as any)?.data ?? (detailRes as any);

  const title = detail?.title ?? "";
  const description = detail?.description ?? "";
  // Changes carry the requester on `requestedBy` (added to ContractChangeDTO);
  // Claims have no equivalent field yet. Keep the old `submittedBy` as a
  // fallback in case a role's detail response still uses it.
  const submittedByName =
    detail?.requestedBy?.name ??
    detail?.requestedBy?.email ??
    detail?.submittedBy?.name ??
    detail?.submittedBy?.email ??
    "";
  const vendorEmail =
    detail?.vendor?.name ?? detail?.vendor?.email ?? detail?.vendor ?? "";
  const changeType = detail?.type ?? "";
  const submittedAt = detail?.submittedAt ?? detail?.createdAt ?? "";
  const status = detail?.status ?? "";
  const approverStatus = detail?.approverStatus ?? "";
  const value = detail?.value;
  const files = detail?.files;
  // Change Orders promoted from a Request/Proposal — and COs/CPs converted from a
  // Change Directive (#86) — carry a back-reference to the origin change in
  // `originalChangeRef`. We surface it as "Reference - Change {Request|Proposal|
  // Directive} Number". The origin type comes from `formatChangeOriginLabel`, not
  // `originalChangeType` directly (the BE emits the typo "Diective" and the
  // detail DTO's enum omits directive) — see the helper for the derivation.
  const changeDisplayId = detail?.changeId ?? "";
  const originalChangeRef = detail?.originalChangeRef;
  const originalChangeType = detail?.originalChangeType as string | undefined;
  const originalChangeRefId =
    typeof originalChangeRef === "string"
      ? originalChangeRef
      : originalChangeRef?.changeId ?? originalChangeRef?._id;

  // Claim specific fields
  const impact = detail?.impact;
  const time = detail?.time;
  const cost = detail?.cost;

  const canApprove = isManager && Boolean(owner);

  // #79 — a draft change order (auto-created from an approved request/proposal,
  // or from a directive) awaits its originator's finalization. Vendor PMs
  // finalize CR/CP-origin drafts; managers finalize directive-origin drafts.
  // The BE 403s if the caller isn't the eligible originator, so gate on role
  // here for UX and let the server enforce ownership.
  const isDraftCo = !isClaim && isDraftChangeOrder({ type: changeType, status });
  // The draft-CO finalize action (approve-draft-co) must be visible to only ONE
  // actor at a time — whoever's turn it currently is — never to every user who
  // happens to hold the role (the QA "approve shown to CM and approvers at the
  // same time" bug). The BE detail endpoint encodes this per user via
  // `approverStatus`: it returns "pending" only when THIS user can act now and
  // "N/A" otherwise, so gate on it and let the server drive the sequential
  // CM → chain routing. Restricted to the roles that can actually call
  // approve-draft-co (CM → manager, Vendor PM → vendor); plain approvers act
  // through the separate /approve chain, not this button.
  const canActOnDraftCo =
    isDraftCo &&
    ((isManager && Boolean(owner)) || isProjectManager) &&
    approverStatus === "pending";

  // #147 — a change directive (CD) needs no approval of itself; the assigned
  // Vendor PM responds by converting it into a Change Order or Change Proposal.
  // Gate on the PM role for UX and let the BE 403 enforce contract assignment
  // (matches the draft-CO gating pattern above).
  const canConvertDirective =
    !isClaim && changeType === "directive" && isProjectManager;

  const statusBadgeTone = (s?: string) => {
    const k = (s ?? "").toLowerCase();
    if (k === "approved" || k === "accepted")
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (k === "rejected")
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    // Draft is a neutral, non-actionable state — render it slate, not the
    // yellow "pending" default (matches the canonical draft badge in
    // ContractDetailPage). `dispute` shares the same neutral tone.
    if (k === "dispute" || k === "draft")
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
  };
  // Change-flow decision actions (manager Approve+Reject, non-manager
  // Send-for-Approval). Unchanged behavior — only the claim branch is
  // re-gated below.
  const showChangeDecisionActions =
    !isClaim &&
    !isDraftCo &&
    shouldShowChangeDecisionActions(changeType) &&
    approverStatus === "pending" &&
    // Active vendor is read-only in CLM; the non-manager "Send for Approval"
    // branch below is for the Vendor-PM, not a plain vendor (strict).
    !isVendor;

  // Claim-flow gating. Per spec:
  //  - Manager: visible Reject + Send for Approval. Send enabled when
  //    impact !== "time", OR (impact === "time" AND approverStatus is
  //    already "approved" AND no approvers have been assigned yet —
  //    i.e. the time-only auto-approve happened but the manager hasn't
  //    routed it for approver review).
  //  - Approver: visible Reject + Approve. For non-time impact, gate on
  //    approverStatus === "pending". For time impact, the user must be
  //    in detail.approvers[].user[].user (only the assigned approver(s)
  //    see the buttons; other approver-role users do not).
  const isTimeImpact = impact === "time";
  const approverList = (detail as any)?.approvers as
    | Array<{ user?: Array<{ user?: string }> }>
    | undefined;
  const currentUserId = currentUser?._id;

  // Edit is restricted to the user who created/submitted the change (QA):
  // detail endpoints populate `requestedBy` (and legacy `submittedBy`) as an
  // object whose `_id` is the requester. When an id is present we match it
  // against the logged-in user; if the BE omits an identifiable id we fall
  // back to the role gate so the real creator isn't locked out by a missing
  // field.
  const changeCreatorId =
    (typeof detail?.requestedBy === "object"
      ? detail?.requestedBy?._id
      : undefined) ??
    (typeof detail?.submittedBy === "object"
      ? detail?.submittedBy?._id
      : undefined);
  const isChangeCreator = changeCreatorId
    ? !!currentUserId && changeCreatorId === currentUserId
    : true;

  // Once the overall claim status is approved/rejected, no further decision
  // actions should be visible — regardless of role or impact.
  const isClaimFinalized =
    status?.toLowerCase() === "approved" ||
    status?.toLowerCase() === "rejected";

  // Refined: for time impact we also need the *current user's* approver
  // entry to still be pending. Without this, an approver who already
  // approved keeps seeing the buttons because `isAssignedApprover` only
  // checked membership, not per-user status.
  const isAssignedApproverPending = React.useMemo(() => {
    if (!currentUserId || !Array.isArray(approverList)) return false;
    return approverList.some(
      (level) =>
        Array.isArray(level?.user) &&
        level.user.some(
          (u: any) => u?.user === currentUserId && u?.status === "pending",
        ),
    );
  }, [approverList, currentUserId]);

  const canApproverDecideOnClaim =
    isClaim &&
    isApprover &&
    !isClaimFinalized &&
    (isTimeImpact ? isAssignedApproverPending : approverStatus === "pending");
  // Manager Send-for-Approval is only relevant for time-impact claims, where
  // the manager auto-approves and then routes to approvers.
  const canManagerActOnClaim =
    isClaim && isManager && Boolean(owner) && isTimeImpact && !isClaimFinalized;
  const isClaimOrChangeManagerSendForApprovalStatus =
    isClaim ? "pending" : "approved";
  const sendForApprovalEnabled =
    approverStatus === isClaimOrChangeManagerSendForApprovalStatus && (approverList?.length ?? 0) === 0;

  // Cost / time_cost claims: manager decides directly (Reject + Approve),
  // same comment-dialog flow as the change-flow approve path. Gated on
  // approverStatus === "pending" to match the approver-side cost claim
  // gate and to hide after a decision.
  const canManagerDecideOnCostClaim =
    isClaim &&
    isManager &&
    Boolean(owner) &&
    (impact === "cost" || impact === "time_cost") &&
    approverStatus === "pending" &&
    !isClaimFinalized;

  const showDecisionActions =
    showChangeDecisionActions ||
    canApproverDecideOnClaim ||
    canManagerActOnClaim ||
    canManagerDecideOnCostClaim;

  // Approve / reject opens a comment dialog first. `pendingAction` drives
  // both the dialog visibility and which variant (Approve vs Reject) we
  // render — `commentDraft` is reset whenever the dialog closes.
  const [pendingAction, setPendingAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [confirmDraftApprove, setConfirmDraftApprove] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"overview" | "comments">(
    "overview",
  );

  React.useEffect(() => {
    if (pendingAction === null) setCommentDraft("");
  }, [pendingAction]);

  // #76 — acquire an exclusive "approve" lock before opening the decision
  // dialog so two managers can't approve/reject the same change at once.
  // Locks apply to changes only (claims have no lock endpoint); fail-open.
  const changeLock = useChangeLock({
    roleBasePath,
    contractId,
    changeId,
    enabled: !isClaim,
  });

  const handleOpenDecision = React.useCallback(
    async (action: "approved" | "rejected") => {
      const res = await changeLock.acquire("approve");
      if (!res.ok && res.conflict) {
        toast.error(
          "Change locked",
          `This change is currently being reviewed by ${res.holder ?? "another user"}. Please try again shortly.`,
        );
        return;
      }
      setPendingAction(action);
    },
    [changeLock, toast],
  );

  // #76 (edit path) — gate opening the edit dialog behind an exclusive "edit"
  // lock. Only one edit dialog renders at a time (pending/rejected vs draft
  // CO), so a single controlled-open flag covers both. Vetoes the open on a
  // 409; fail-open otherwise (the acquire itself never rejects).
  const [editOpen, setEditOpen] = React.useState(false);
  const handleEditOpenChange = React.useCallback(
    async (next: boolean) => {
      if (next) {
        const res = await changeLock.acquire("edit");
        if (!res.ok && res.conflict) {
          toast.error(
            "Change locked",
            `This change is currently being edited by ${res.holder ?? "another user"}. Please try again shortly.`,
          );
          return;
        }
        setEditOpen(true);
      } else {
        setEditOpen(false);
        changeLock.release();
      }
    },
    [changeLock, toast],
  );

  const { mutate: mutateApproval, isPending: isApproving } = useMutation({
    mutationKey: ["approveChange", roleBasePath, contractId, changeId],
    mutationFn: async ({
      action,
      comment,
    }: {
      action: "approved" | "rejected";
      comment: string;
    }) => {
      const canApprovePath =
        roleBasePath.includes("/manager/") ||
        roleBasePath.includes("/approver/");
      if (!canApprovePath) {
        throw new Error(
          "Approve endpoint is not available for this role.",
        );
      }
      const url = getManagerApproveChangeUrl({
        roleBasePath,
        contractId,
        changeId,
      });
      return await postRequest({
        url,
        payload: { action, comment },
      });
    },
    onSuccess: (res, { action }) => {
      toast.success(
        `Change ${action === "approved" ? "approved" : "rejected"}`,
        (res as any)?.data?.message,
      );
      // Default list key is context-aware: claims when used in dual-purpose
      // `isClaim` mode, changes otherwise. Either way the caller can override.
      const defaultListKey: readonly unknown[] = isClaim
        ? ["contractClaims"]
        : ["contractChanges", contractId];
      qc.invalidateQueries({
        queryKey: listInvalidateQueryKey ?? defaultListKey,
      });
      if (statsInvalidateQueryKey) {
        qc.invalidateQueries({ queryKey: statsInvalidateQueryKey });
      }
      qc.invalidateQueries({ queryKey: changeDetailQueryKey });
      setPendingAction(null);
      changeLock.release();
    },
    onError: (err: any) => {
      toast.error("Failed to update change status", err);
    },
  });

  // #79 — finalize a draft change order directly (no modification). POSTs the
  // bodyless `approve-draft-co`, which sets the CO to "approved" and applies
  // its value to the contract immediately.
  const { mutate: approveDraftCo, isPending: isApprovingDraft } = useMutation({
    mutationKey: ["approveDraftCo", roleBasePath, contractId, changeId],
    mutationFn: async () => {
      const url = getApproveDraftCoUrl({ roleBasePath, contractId, changeId });
      return await postRequest({ url, payload: {} });
    },
    onSuccess: (res) => {
      toast.success(
        "Change order approved",
        (res as any)?.data?.message ??
          "The change order value has been applied to the contract.",
      );
      qc.invalidateQueries({
        queryKey: listInvalidateQueryKey ?? ["contractChanges", contractId],
      });
      if (statsInvalidateQueryKey) {
        qc.invalidateQueries({ queryKey: statsInvalidateQueryKey });
      }
      qc.invalidateQueries({ queryKey: changeDetailQueryKey });
      setConfirmDraftApprove(false);
    },
    onError: (err: any) => {
      toast.error("Failed to approve change order", err);
    },
  });

  // #147 — convert a change directive into a Change Order or Change Proposal.
  // Title/description/amount are pre-filled from the directive (all required by
  // the BE); the new change then runs the standard CM→approvers approval flow.
  const [convertOpen, setConvertOpen] = React.useState(false);
  const [convertType, setConvertType] = React.useState<"order" | "proposal">(
    "order",
  );
  const [convertTitle, setConvertTitle] = React.useState("");
  const [convertDescription, setConvertDescription] = React.useState("");
  const [convertAmount, setConvertAmount] = React.useState("");
  const [convertUrgency, setConvertUrgency] = React.useState("");
  const [convertFiles, setConvertFiles] = React.useState<File[]>([]);

  const openConvertDialog = React.useCallback(() => {
    setConvertType("order");
    setConvertTitle(title);
    setConvertDescription(description);
    setConvertAmount(value != null ? String(value) : "");
    setConvertUrgency((detail?.urgency as string) ?? "");
    setConvertFiles([]);
    setConvertOpen(true);
  }, [title, description, value, detail]);

  const convertAmountValid =
    convertAmount.trim() !== "" &&
    Number.isFinite(Number(convertAmount.replace(/[$,\s]/g, "")));
  const convertValid =
    convertTitle.trim() !== "" &&
    convertDescription.trim() !== "" &&
    convertAmountValid;

  const { mutate: convertDirective, isPending: isConverting } = useMutation({
    mutationKey: ["convertDirective", roleBasePath, contractId, changeId],
    mutationFn: async () => {
      const url = getConvertDirectiveUrl({ roleBasePath, contractId, changeId });
      // Pre-upload any attached documents to /upload, then transmit their
      // metadata with the new change order/proposal (QA #160).
      const uploadedFiles = (
        await Promise.all(
          convertFiles.map(async (file) => {
            const res = await postRequest({
              url: "/upload",
              payload: (() => {
                const fd = new FormData();
                fd.append("file", file);
                return fd;
              })(),
              config: { headers: { "Content-Type": "multipart/form-data" } },
            });
            const uploaded = (res as any)?.data?.data?.[0] as
              | UploadURLs
              | undefined;
            return uploaded?.url ? toContractChangeFileItem(file, uploaded) : undefined;
          }),
        )
      ).filter(
        (item): item is { name: string; url: string; type: string; size: string } =>
          Boolean(item),
      );
      const payload = toConvertDirectivePayload({
        type: convertType,
        title: convertTitle,
        description: convertDescription,
        amount: convertAmount,
        urgency: convertUrgency,
        files: uploadedFiles,
      });
      return await postRequest({ url, payload });
    },
    onSuccess: (res) => {
      toast.success(
        convertType === "order"
          ? "Directive converted to change order"
          : "Directive converted to change proposal",
        (res as any)?.data?.message ??
          "The new change has been sent for approval.",
      );
      qc.invalidateQueries({
        queryKey: listInvalidateQueryKey ?? ["contractChanges", contractId],
      });
      if (statsInvalidateQueryKey) {
        qc.invalidateQueries({ queryKey: statsInvalidateQueryKey });
      }
      qc.invalidateQueries({ queryKey: changeDetailQueryKey });
      setConvertOpen(false);
    },
    onError: (err: any) => {
      toast.error("Failed to convert directive", err);
    },
  });

  const docs: DocType[] = React.useMemo(() => {
    const source = Array.isArray(files) ? files : [];
    return source.map((file: any, index: number) => {
      const ext = getSimpleFileExtension(file?.name || "").toUpperCase();
      const rawSize = file?.size;
      const sizeLabel =
        typeof rawSize === "number"
          ? formatFileSize(rawSize)
          : typeof rawSize === "string" && Number.isFinite(Number(rawSize))
            ? formatFileSize(Number(rawSize))
            : typeof rawSize === "string"
              ? rawSize
              : "—";
      return {
        id: `${file?.name || "attachment"}-${index}`,
        name: file?.name || "Attachment",
        type: ext,
        size: sizeLabel,
        url: file?.url,
        icon: getFileIcon(ext),
      };
    });
  }, [files]);

  const handlePreview = React.useCallback((d: DocType) => {
    window.open(d.url || "#", "_blank");
  }, []);

  const handleDownload = React.useCallback((d: DocType) => {
    if (!d.url) return;
    const link = document.createElement("a");
    link.href = d.url;
    link.download = d.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const commentsQueryKey = useUserQueryKey([
    "contract-change-comments",
    roleBasePath,
    contractId,
    changeId,
  ]);

  const canLoadComments =
    open && !!contractId && !!changeId && (isManager || isApprover || isContractVendorLike);

  const { data: commentsRes, isLoading: isCommentsLoading } = useQuery({
    queryKey: commentsQueryKey,
    queryFn: async () => {
      const url = roleBasePath.includes("/vendor/")
        ? `${roleBasePath}/${changeId}/comment`
        : roleBasePath.includes("/manager/")
          ? usesListBasePath
            ? `${roleBasePath}/${changeId}/comments`
            : `${roleBasePath}/${contractId}/changes/${changeId}/comments`
          : usesListBasePath
            ? `${roleBasePath}/${changeId}/comment`
            : `${roleBasePath}/${contractId}/change/${changeId}/comment`;
      const res = await getRequest({ url });
      return (res as any)?.data;
    },
    enabled: canLoadComments,
    staleTime: 30_000,
  });

  const comments =
    ((commentsRes as any)?.data?.data ?? (commentsRes as any)?.data) || [];

  const { mutate: mutateAddComment, isPending: isAddingComment } = useMutation({
    mutationKey: ["addChangeComment", roleBasePath, contractId, changeId],
    mutationFn: async (content: string) => {
      if (!content.trim()) return;
      const payload = { content };
      const url = roleBasePath.includes("/vendor/")
        ? `${roleBasePath}/${changeId}/comment`
        : roleBasePath.includes("/manager/")
          ? usesListBasePath
            ? `${roleBasePath}/${changeId}/comments`
            : `${roleBasePath}/${contractId}/changes/${changeId}/comments`
          : usesListBasePath
            ? `${roleBasePath}/${changeId}/comment`
            : `${roleBasePath}/${contractId}/change/${changeId}/comment`;
      await postRequest({ url, payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: commentsQueryKey });
    },
    onError: (err: any) => {
      toast.error("Failed to send comment", err);
    },
  });

  if (isDetailLoading) {
    return (
      <div className="flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        className="sm:max-w-2xl lg:max-w-3xl rounded-2xl overflow-y-auto"
        side="right"
      >
        <div className="space-y-6" data-testid="change-details-sheet">
          <SheetHeader>
            <SheetTitle>{isClaim ? "Claim Details" : "Change Details"}</SheetTitle>
          </SheetHeader>

          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "overview" | "comments")}
            className="space-y-4"
          >
            <TabsList className="h-auto rounded-none border-b w-full border-gray-300 dark:border-gray-600 dark:bg-transparent p-0 justify-start bg-transparent">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Comments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <LabelRow label={isClaim ? "Claim Title" : "Change Title"} value={title} />
                  {!isClaim && changeDisplayId && (
                    <LabelRow label="Change ID" value={changeDisplayId} />
                  )}
                  <LabelRow label={isClaim ? "Claim Type" : "Change Type"} value={formatSecurityType(changeType)} />
                  {!isClaim &&
                    (changeType === "order" || changeType === "proposal") &&
                    originalChangeRefId && (
                      <LabelRow
                        label={`Reference - Change ${formatChangeOriginLabel({ changeType, originalChangeType })} Number`}
                        value={originalChangeRefId}
                      />
                    )}
                  {isClaim && impact && (
                    <LabelRow label="Impact" value={impact.replace("_", " ")} highlight />
                  )}
                  <LabelRow
                    label="Submission Date"
                    value={submittedAt ? formatDate(submittedAt, "yyyy MMM dd HH:mm aa") : null}
                  />
                  <LabelRow
                    label="Submitted by"
                    value={
                      <a className="text-blue-600 dark:text-blue-400 underline">
                        {isDetailLoading ? "" : submittedByName}
                      </a>
                    }
                  />
                </div>

                <div>
                  <LabelRow
                    label="Vendor/Contractor"
                    value={
                      <a className="text-blue-600 dark:text-blue-400 underline">
                        {isDetailLoading ? "" : vendorEmail}
                      </a>
                    }
                  />
                  {isClaim ? (
                    <>
                      {(impact === "time" || impact === "time_cost") && (
                        <LabelRow label="Time Impact (Days)" value={time ?? "—"} />
                      )}
                      {(impact === "cost" || impact === "time_cost") && (
                        <LabelRow
                          label="Cost Impact"
                          value={cost != null ? formatCurrency(Number(cost), "en-US", currencyCode) : "—"}
                          highlight
                        />
                      )}
                    </>
                  ) : (
                    <LabelRow
                      label="Value"
                      value={
                        isDetailLoading
                          ? ""
                          : value != null
                            ? formatCompactCurrency(Number(value), currencyCode)
                            : "-"
                      }
                      highlight
                    />
                  )}
                  <LabelRow
                    label="Status"
                    value={
                      <Badge
                        className={cn("capitalize", statusBadgeTone(status))}
                      >
                        {isDetailLoading ? "" : status || "-"}
                      </Badge>
                    }
                  />
                  <div className="py-2" />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Description</span>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {isDetailLoading ? "" : description}
                </p>
              </div>

              <div className="space-y-5">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Attached Documents
                </span>
                <div className="grid grid-cols-1 gap-3">
                  {docs.map((d) => (
                    <DocumentItem
                      key={d.id}
                      d={d}
                      handlePreview={handlePreview}
                      handleDownload={handleDownload}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="flex items-center justify-between">
                <div />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>All</DropdownMenuItem>
                    <DropdownMenuItem disabled>Unread</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Separator />

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                {isCommentsLoading ? (
                  <p className="text-sm text-slate-700 dark:text-slate-300">Loading comments...</p>
                ) : Array.isArray(comments) && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((c: any) => (
                      <div key={c?._id} className="space-y-1">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {(c?.user?.name || c?.user?.email || "").toString()}
                        </div>
                        <div
                          className="text-sm text-slate-700 dark:text-slate-200 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: c?.content || "" }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 dark:text-slate-300">No comments yet.</p>
                )}
              </div>

              {!isVendor && (
                <MessageComposer
                  onSend={(content) => {
                    mutateAddComment(content);
                  }}
                  isLoading={isAddingComment}
                  sendType={null}
                  isNewChat={false}
                  onSendTypeChange={() => { }}
                  sendLabel="Send"
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Vendor/PM edit (pending) or resubmit (rejected) — bottom footer,
              matching the Deliverables detail layout. */}
          {isProjectManager &&
            isChangeCreator &&
            activeTab === "overview" &&
            (status?.toLowerCase?.() === "pending" ||
              status?.toLowerCase?.() === "rejected") && (
              <SheetFooter>
                <div className="flex w-full gap-3 pt-2 justify-end">
                  {!isClaim ? (
                    <CreateChangeDialog
                      contractId={contractId}
                      isManager={false}
                      mode="edit"
                      isResubmit={status?.toLowerCase?.() === "rejected"}
                      changeId={changeId}
                      open={editOpen}
                      onOpenChange={handleEditOpenChange}
                      initialChange={{
                        title,
                        type: changeType,
                        description,
                        files: files as any,
                      }}
                      trigger={
                        <Button
                          data-testid="edit-change-trigger"
                          className="h-11 w-64 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                        >
                          {status?.toLowerCase?.() === "rejected"
                            ? "Resubmit"
                            : "Edit"}
                        </Button>
                      }
                    />
                  ) : (
                    <RequestClaimDialog
                      mode="edit"
                      isResubmit={status?.toLowerCase?.() === "rejected"}
                      editPath={
                        usesListBasePath
                          ? `${roleBasePath}/${changeId}`
                          : `${roleBasePath}/${contractId}/claims/${changeId}`
                      }
                      detailInvalidateQueryKey={changeDetailQueryKey}
                      initialClaim={{
                        title,
                        type: changeType,
                        impact:
                          impact === "time" ||
                          impact === "cost" ||
                          impact === "time_cost"
                            ? impact
                            : undefined,
                        time,
                        cost,
                        description,
                        files: files as any,
                      }}
                      trigger={
                        <Button
                          data-testid="edit-claim-trigger"
                          className="h-11 w-64 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                        >
                          {status?.toLowerCase?.() === "rejected"
                            ? "Resubmit"
                            : "Edit"}
                        </Button>
                      }
                    />
                  )}
                </div>
              </SheetFooter>
            )}

          {/* #79/#117 — draft change-order finalization by its originator only.
              They either approve it directly (Approve → approve-draft-co, applies
              the value now under the prior approval — the BE performs the
              conversion) or edit it (Vendor PM only
              for now — the edit PUT routes through the vendor API;
              manager/directive-origin edit is a follow-up) to send it through a
              fresh approval. The CM has no action here on a CR/CP-origin draft. */}
          {canActOnDraftCo && activeTab === "overview" && (
            <SheetFooter>
              <div className="flex w-full gap-3 pt-2">
                {isProjectManager && (
                  <CreateChangeDialog
                    contractId={contractId}
                    isManager={false}
                    mode="edit"
                    changeId={changeId}
                    open={editOpen}
                    onOpenChange={handleEditOpenChange}
                    initialChange={{
                      title,
                      type: changeType,
                      description,
                      files: files as any,
                    }}
                    trigger={
                      <Button
                        variant="outline"
                        data-testid="edit-draft-co-trigger"
                        className="flex-1 h-12 rounded-xl"
                      >
                        Edit & Send for Approval
                      </Button>
                    }
                  />
                )}
                <Button
                  className="flex-1 h-12 rounded-xl"
                  data-testid="approve-draft-co"
                  disabled={isApprovingDraft}
                  onClick={() => setConfirmDraftApprove(true)}
                >
                  Approve Change Order
                </Button>
              </div>
            </SheetFooter>
          )}

          {/* #147 — the assigned Vendor PM converts a change directive into a
              Change Order or Change Proposal (the directive itself needs no
              approval). Opens a dialog pre-filled from the directive. */}
          {canConvertDirective && activeTab === "overview" && (
            <SheetFooter>
              <div className="flex w-full justify-end pt-2">
                <Button
                  data-testid="convert-directive-trigger"
                  className="h-11 w-64 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white"
                  onClick={openConvertDialog}
                >
                  Convert Directive
                </Button>
              </div>
            </SheetFooter>
          )}

          {showDecisionActions && activeTab === "overview" && (
            <SheetFooter>
              {/* Change flow (unchanged): manager gets Reject+Approve;
                  non-manager gets Reject (disabled) + Send for Approval. */}
              {showChangeDecisionActions && (
                <div className="flex w-full gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    disabled={!canApprove || isApproving}
                    onClick={() => {
                      if (!canApprove) {
                        toast.error(
                          "Action not allowed",
                          "Only managers can reject changes",
                        );
                        return;
                      }
                      handleOpenDecision("rejected");
                    }}
                  >
                    Reject Change
                  </Button>
                  {canApprove ? (
                    <Button
                      className="flex-1 h-12 rounded-xl"
                      disabled={isApproving}
                      onClick={() => handleOpenDecision("approved")}
                    >
                      Approve
                    </Button>
                  ) : (
                    <SendApprovalDialog
                      contractId={contractId}
                      entityLabel="change"
                      onSent={() =>
                        qc.invalidateQueries({ queryKey: changeDetailQueryKey })
                      }
                      trigger={
                        <Button className="flex-1 h-12 rounded-xl">
                          Send for Approval
                        </Button>
                      }
                    />
                  )}
                </div>
              )}

              {/* Claim flow — approver path: identity-gated Reject + Approve. */}
              {canApproverDecideOnClaim && (
                <div className="flex w-full gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    disabled={isApproving}
                    onClick={() => setPendingAction("rejected")}
                  >
                    Reject Claim
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl"
                    disabled={isApproving}
                    onClick={() => setPendingAction("approved")}
                  >
                    Approve
                  </Button>
                </div>
              )}

              {/* Claim flow — manager path (cost / time_cost): direct
                  Reject + Approve via the same comment-dialog flow as the
                  change-flow approve path. Time-impact stays on the
                  Send-for-Approval branch below. */}
              {canManagerDecideOnCostClaim && (
                <div className="flex w-full gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl"
                    disabled={isApproving}
                    onClick={() => setPendingAction("rejected")}
                  >
                    Reject Claim
                  </Button>
                  <Button
                    className="flex-1 h-12 rounded-xl"
                    disabled={isApproving}
                    onClick={() => setPendingAction("approved")}
                  >
                    Approve
                  </Button>
                </div>
              )}

              {/* Claim flow — manager path (time impact only):
                  right-aligned Send for Approval, no Reject. */}
              {canManagerActOnClaim && !canApproverDecideOnClaim && (
                <div className="flex w-full justify-end pt-2">
                  <SendApprovalDialog
                    contractId={contractId}
                    entityLabel="claim"
                    assignUrl={
                      claimAssignUrl ??
                      `/contract/manager/contracts/${contractId}/claims/${changeId}/approvers`
                    }
                    onSent={() => {
                      qc.invalidateQueries({ queryKey: changeDetailQueryKey });
                      qc.invalidateQueries({
                        queryKey: listInvalidateQueryKey ?? ["contractClaims"],
                      });
                    }}
                    trigger={
                      <Button
                        className="h-12 rounded-xl px-6"
                        disabled={!sendForApprovalEnabled}
                      >
                        Send for Approval
                      </Button>
                    }
                  />
                </div>
              )}
            </SheetFooter>
          )}
        </div>

        <Dialog
          open={pendingAction !== null}
          onOpenChange={(next) => {
            if (!next && !isApproving) {
              setPendingAction(null);
              changeLock.release();
            }
          }}
        >
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {pendingAction === "approved"
                  ? isClaim
                    ? "Approve Claim"
                    : "Approve Change"
                  : isClaim
                    ? "Reject Claim"
                    : "Reject Change"}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                {pendingAction === "approved"
                  ? `Add an optional comment for the vendor before approving${isClaim ? " this claim" : ""}.`
                  : `Let the vendor know why this ${isClaim ? "claim" : "change"} is being rejected (optional).`}
              </p>
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Enter your comment"
                rows={5}
                className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#0F0F0F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2A4467] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                autoFocus
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:text-slate-100"
                  disabled={isApproving}
                  onClick={() => setPendingAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "h-11 flex-1 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed",
                    pendingAction === "approved"
                      ? "bg-[#16A34A] hover:bg-[#15803D]"
                      : "bg-[#E53935] hover:bg-[#C62828]",
                  )}
                  disabled={isApproving}
                  aria-busy={isApproving}
                  onClick={() => {
                    if (pendingAction === null) return;
                    mutateApproval({
                      action: pendingAction,
                      comment: commentDraft.trim(),
                    });
                  }}
                >
                  {isApproving
                    ? pendingAction === "approved"
                      ? "Approving..."
                      : "Rejecting..."
                    : pendingAction === "approved"
                      ? "Confirm Approve"
                      : "Confirm Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* #79 — confirm direct finalization of a draft change order. */}
        <Dialog
          open={confirmDraftApprove}
          onOpenChange={(next) => {
            if (!next && !isApprovingDraft) setConfirmDraftApprove(false);
          }}
        >
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                Approve Change Order
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                Approving this draft change order applies its value
                {value != null
                  ? ` (${formatCompactCurrency(Number(value), currencyCode)})`
                  : ""}{" "}
                to the contract immediately — the prior approval still stands, so
                no new approval is required. To review or attach documents first,
                use “Edit &amp; Send for Approval” instead.
              </p>
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:text-slate-100"
                  disabled={isApprovingDraft}
                  onClick={() => setConfirmDraftApprove(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-xl bg-[#16A34A] text-sm font-semibold text-white hover:bg-[#15803D] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isApprovingDraft}
                  aria-busy={isApprovingDraft}
                  onClick={() => approveDraftCo()}
                >
                  {isApprovingDraft ? "Approving..." : "Confirm Approve"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* #147 — convert a change directive to a CO or CP. */}
        <Dialog
          open={convertOpen}
          onOpenChange={(next) => {
            if (!next && !isConverting) setConvertOpen(false);
          }}
        >
          <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Convert Directive
                </DialogTitle>
                {changeDisplayId && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {changeDisplayId}
                  </span>
                )}
              </div>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Convert this directive into a Change Order or Change Proposal.
                The new change is sent for approval — CM first, then approvers.
              </p>

              {/* Signature: segmented CO/CP toggle with a sliding indicator.
                  The indicator width equals one slot, so translateX(100%) lands
                  it exactly on the second option. Modal keeps a centered origin;
                  only this control animates (transform-only, reduced-motion safe). */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Convert to
                </label>
                <div className="relative flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] will-change-transform motion-reduce:transition-none dark:bg-slate-700 dark:ring-white/10"
                    style={{
                      transform:
                        convertType === "proposal"
                          ? "translateX(100%)"
                          : "translateX(0)",
                    }}
                  />
                  {(
                    [
                      { key: "order", label: "Change Order" },
                      { key: "proposal", label: "Change Proposal" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      data-testid={`convert-type-${opt.key}`}
                      disabled={isConverting}
                      aria-pressed={convertType === opt.key}
                      onClick={() => setConvertType(opt.key)}
                      className={cn(
                        "relative z-10 flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A4467] disabled:cursor-not-allowed",
                        convertType === opt.key
                          ? "text-[#1F3B63] dark:text-white"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Title
                </label>
                <input
                  value={convertTitle}
                  onChange={(e) => setConvertTitle(e.target.value)}
                  placeholder="Change title"
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#2A4467] focus:outline-none focus:ring-2 focus:ring-[#2A4467]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={convertDescription}
                  onChange={(e) => setConvertDescription(e.target.value)}
                  placeholder="Describe the change"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#2A4467] focus:outline-none focus:ring-2 focus:ring-[#2A4467]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400 dark:text-slate-500">
                      {currencyCode}
                    </span>
                    <input
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-14 pr-3 text-sm tabular-nums text-slate-900 transition-colors placeholder:text-slate-400 focus:border-[#2A4467] focus:outline-none focus:ring-2 focus:ring-[#2A4467]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    Urgency
                  </label>
                  <select
                    value={convertUrgency}
                    onChange={(e) => setConvertUrgency(e.target.value)}
                    className="h-[46px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 transition-colors focus:border-[#2A4467] focus:outline-none focus:ring-2 focus:ring-[#2A4467]/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    <option value="">Not set</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Supporting Documents
                </label>
                <label
                  htmlFor="convert-directive-files"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500 transition-colors hover:border-[#2A4467] hover:text-[#2A4467] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                >
                  <Upload className="h-4 w-4" />
                  <span>Click to attach documents (sent with the {convertType === "order" ? "change order" : "change proposal"})</span>
                </label>
                <input
                  id="convert-directive-files"
                  type="file"
                  multiple
                  className="hidden"
                  disabled={isConverting}
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (picked.length) {
                      setConvertFiles((prev) => [...prev, ...picked]);
                    }
                    // Reset so re-selecting the same file fires onChange again.
                    e.target.value = "";
                  }}
                />
                {convertFiles.length > 0 && (
                  <ul className="space-y-1.5 pt-1">
                    {convertFiles.map((file, idx) => (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      >
                        <span className="truncate text-slate-700 dark:text-slate-200" title={file.name}>
                          {file.name}
                        </span>
                        <button
                          type="button"
                          className="shrink-0 text-slate-400 transition-colors hover:text-red-600 disabled:opacity-50"
                          disabled={isConverting}
                          onClick={() =>
                            setConvertFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-slate-200 text-sm font-semibold text-slate-700 transition-transform duration-150 ease-out active:scale-[0.98] dark:border-slate-700 dark:text-slate-100"
                  disabled={isConverting}
                  onClick={() => setConvertOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  data-testid="confirm-convert-directive"
                  className="h-11 flex-1 rounded-xl bg-[#1F3B63] text-sm font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#16304f] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#2A4467] focus-visible:ring-offset-2 dark:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
                  disabled={isConverting || !convertValid}
                  aria-busy={isConverting}
                  onClick={() => convertDirective()}
                >
                  {isConverting
                    ? "Converting..."
                    : convertType === "order"
                      ? "Convert to Change Order"
                      : "Convert to Change Proposal"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
};

export default ChangeDetailsSheet;
