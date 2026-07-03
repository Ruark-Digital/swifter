import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Search,
  Share2,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserQueryKey } from "@/hooks/useUserQueryKey";
import { getRequest, patchRequest, postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";
import { DocType, DocumentItem } from "./DocumentItem";
import { DocumentViewer } from "@/components/ui/DocumentViewer";
import { getFileExtension, getFileIcon } from "@/lib/fileUtils";
import { format } from "date-fns";
// import { useNavigate } from "react-router-dom";

export type AmendmentRow = {
  id: string;
  amendmentId: string;
  amendmentTitle: string;
  vendorStatus: "Accepted" | "Pending" | "Rejected";
  status: "Approved" | "Pending" | "Rejected";
};

type AmendmentDetailsSheetProps = {
  trigger: React.ReactNode;
  contractId: string;
  basePath: string;
  amendmentId: string;
  summary: Pick<
    AmendmentRow,
    "amendmentTitle" | "amendmentId" | "vendorStatus" | "status"
  >;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  approverPoolPath?: string;
  renderManagerRejectedAction?: (args: {
    detail: AmendmentDetail;
    onSubmitted: () => void;
    trigger: React.ReactElement;
  }) => React.ReactNode;
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
  <div className="space-y-2 py-2">
    <span className="text-sm text-[#6B7280] dark:text-slate-400 block">{label}</span>
    <span
      className={`text-sm font-semibold block ${
        highlight ? "font-semibold text-[#0F0F0F] dark:text-slate-100" : "text-[#111827] dark:text-slate-100"
      }`}
    >
      {value}
    </span>
  </div>
);

export interface AmendmentDetail {
  _id: string;
  contractRef: string;
  approverStatus: "pending" | "approved" | "rejected";
  vendorStatus: "pending" | "accepted" | "rejected";
  contractRefModel: string;
  assignApprover: boolean;
  amendmentId: string;
  company: string;
  status: string;
  title: string;
  impact: string;
  description: string;
  clause?: string;
  others?: string;
  comments?: string;
  changes: Change[];
  submittedBy: SubmittedBy;
  files: File[];
  approvers: Approvers[];
  statusHistory: any[];
  __v: number;
}

export interface Approvers {
  user: User[];
  amount: number;
  group: string;
  levelStatus: string;
  completedAt: null;
  _id: string;
}

export interface User {
  user: string;
  status: string;
  comment: string;
  actionedAt: null;
  _id: string;
}

export interface Change {
  field: string;
  oldValue: string;
  newValue: Date;
  _id: string;
}

export interface File {
  name: string;
  url: string;
  type: string;
  size: string;
  _id: string;
  uploadedAt: Date;
}

export interface SubmittedBy {
  _id: string;
  email: string;
}

export interface ApproveUser {
  approverId: string;
  name: string;
  email: string;
  userRef: string;
  role: string;
  approvalLevels: number[];
  totalAssignments: number;
  assignedApprovals: string;
  approvedCount: number;
  rejectedCount: number;
  pendingCount: number;
  totalCount: number;
  status: string;
}

type PersonnelApiResponse = {
  status: number;
  message: string;
  data: ApproveUser[];
};

const StatusPill = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase();
  const tone =
    normalized === "approved" || normalized === "accepted"
      ? "bg-[#43A0471A] text-[#43A047]"
      : normalized === "pending"
        ? "bg-[#FACC151A] text-[#FACC15]"
        : "bg-[#E539351A] text-[#E53935]";
  const label = `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}
    >
      {label}
    </span>
  );
};

const VendorAcceptDialog: React.FC<{
  trigger: React.ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  open: boolean;
}> = ({ trigger, onConfirm, onClose, open, isPending }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[498px] h-[260px] p-4 rounded-2xl border-0 flex flex-col items-center justify-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-600 text-green-600">
          <Check className="h-8 w-8" />
        </div>
        <div className="text-center text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
          Accept this Amendment?
        </div>
        <div className="flex w-full gap-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] h-11 text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-green-600 h-11 text-base font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Processing..." : "Confirm Accept"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VendorRejectDialog: React.FC<{
  trigger: React.ReactNode;
  isPending?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  open: boolean;
}> = ({ trigger, onConfirm, onClose, open, isPending }) => {
  const [reason, setReason] = React.useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[700px] h-fit p-8 rounded-2xl border-0 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
            Reject Amendment
          </div>
          <button type="button" onClick={onClose} className="text-[#E53935]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-[#3D3D3D] dark:text-slate-300">
            Why are you rejecting this amendment?
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection"
            className="h-[120px] w-full resize-none rounded-lg border border-[#E5E7EB] p-4 text-sm text-[#0F0F0F] dark:text-slate-100 placeholder:text-[#6B7280] dark:text-slate-400/50"
          />
        </div>

        <div className="flex w-full justify-end gap-6">
          <button
            type="button"
            onClick={onClose}
            className="w-[306px] rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] h-11 text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            Back
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => onConfirm(reason.trim())}
            className="w-[306px] rounded-xl bg-[#E53935] h-11 text-base font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Rejecting..." : "Reject Amendment"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AssignApprovalDialog: React.FC<{
  trigger: React.ReactNode;
  contractId: string;
  basePath: string;
  amendmentId: string;
  onAssigned: () => void;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  approverPoolPath?: string;
}> = ({
  trigger,
  contractId,
  basePath,
  amendmentId,
  onAssigned,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  approverPoolPath,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const resolvedApproverPoolPath =
    approverPoolPath ?? `/contract/manager/contracts/${contractId}/approvers`;

  const { data, isLoading } = useQuery<PersonnelApiResponse>({
    queryKey: ["contract-approvers", contractId, resolvedApproverPoolPath],
    queryFn: async () => {
      const res = await getRequest({ url: resolvedApproverPoolPath });
      return res.data as PersonnelApiResponse;
    },
    enabled: open,
    staleTime: 60_000,
    retry: false,
  });

  const allApprovers = React.useMemo(() => {
    return data?.data ?? [];
  }, [data?.data]);

  const groupOptions = React.useMemo(() => {
    const levelSet = new Set<number>();
    for (const a of allApprovers) {
      const levels = a?.approvalLevels ?? [];
      for (const lvl of levels) {
        if (typeof lvl === "number" && !Number.isNaN(lvl)) levelSet.add(lvl);
      }
    }
    const levels = Array.from(levelSet).sort((a, b) => a - b);
    return levels.map((level) => ({
      value: String(level),
      label: `Approval Level ${level}`,
    }));
  }, [allApprovers]);

  const displayApprovers = React.useMemo(() => {
    if (!selectedGroup) return [];
    const list = allApprovers.filter((p) =>
      (p?.approvalLevels ?? []).some((lvl) => String(lvl) === selectedGroup),
    );
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((p) => {
      const name = p.name || "";
      return (
        name.toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [allApprovers, selectedGroup, search]);

  const toggleAssigned = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const assignedUsers = React.useMemo(() => {
    // Need to handle the different data structure here too
    const byId = new Map(
      ((allApprovers as any[]) ?? []).map((p) => [p.approverId, p]),
    );
    return selectedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [allApprovers, selectedIds]);

  const assignMutation = useMutation({
    mutationFn: async () => {
      return await postRequest({
        url: `${basePath}/${amendmentId}/approvers`,
        payload: { userIds: selectedIds },
      });
    },
    onSuccess: () => {
      toast.success("Success", "Approvers assigned successfully");
      queryClient.invalidateQueries({
        queryKey:
          listInvalidateQueryKey ?? ["contract-amendments", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey:
          statsInvalidateQueryKey ?? [
            "contract-amendments-stats",
            contractId,
            basePath,
          ],
      });
      onAssigned();
      setOpen(false);
      setSelectedIds([]);
      setSelectedGroup("");
      setSearch("");
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error?.response?.data?.message ??
          error?.message ??
          "Failed to assign approvers",
      );
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[864px] h- p-8 rounded-2xl border-0 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="text-xl font-semibold text-[#0F0F0F] dark:text-slate-100">
            Send for Approval
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[#E53935]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3 w-full">
          <div className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
            Select Approvers Group
          </div>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="h-14 w-full rounded-lg border border-[#E5E7EB] dark:border-slate-700 px-4 text-sm">
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              {groupOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col rounded-xl border border-[#E5E7EB] dark:border-slate-700 overflow-hidden w-full">
          <div className="flex items-center justify-between bg-[#F9FAFB] dark:bg-slate-800 px-6 py-4 border-b border-[#E5E7EB] dark:border-slate-700">
            <div className="w-[150px] text-sm font-semibold text-[#2A4467] dark:text-blue-300">
              Group
            </div>
            <div className="w-[150px] text-center text-sm font-semibold text-[#2A4467] dark:text-blue-300">
              Role
            </div>
            <div className="w-[121px] text-center text-sm font-semibold text-[#2A4467] dark:text-blue-300">
              Action
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-sm text-[#6B7280] dark:text-slate-400">Loading...</div>
            ) : !selectedGroup ? (
              <div className="p-6 text-sm text-[#6B7280] dark:text-slate-400">
                Select an approver group to view members.
              </div>
            ) : displayApprovers.length === 0 ? (
              <div className="p-6 text-sm text-[#6B7280] dark:text-slate-400">
                No approvers in this group.
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-3">
                {displayApprovers.map((p: any) => {
                  const name = p.name || p.email;
                  const id = p.approverId || p._id;
                  const roleName = p.role || "Approver";
                  const assigned = selectedIds.includes(id);
                  return (
                    <div
                      key={id}
                      className="flex items-start justify-between px-6"
                    >
                      <div className="w-[150px] py-2">
                        <div className="text-sm font-semibold text-[#374151] dark:text-slate-300">
                          {name}
                        </div>
                        <a
                          className="text-xs text-[#286EE0] underline"
                          href={`mailto:${p.email}`}
                        >
                          {p.email}
                        </a>
                      </div>
                      <div className="w-[150px] py-2 text-center text-sm font-medium text-[#374151] dark:text-slate-300">
                        {roleName}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAssigned(id)}
                        className="w-[121px] py-2 flex items-center justify-center gap-2"
                      >
                        {assigned ? (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#00A859]">
                            <Check className="h-2 w-2 text-white" />
                          </span>
                        ) : (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#DDDDDD] dark:border-slate-600" />
                        )}
                        <span className="text-sm font-medium text-[#353535] dark:text-slate-300">
                          Assign
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 w-full">
          <div className="text-sm font-medium text-[#0F0F0F] dark:text-slate-100">
            Assigned Approvers
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-4 dark:border-slate-700 dark:bg-slate-800">
            {assignedUsers.map((p: any) => {
              const name = p.name || p.email;
              const id = p.approverId || p._id;
              return (
                <div
                  key={id}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2A44671A] px-2 py-1"
                >
                  <span className="text-xs font-semibold text-[#2A4467] dark:text-blue-300">
                    {name}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleAssigned(id)}
                    className="text-[#E53935]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent text-sm text-[#0F0F0F] dark:text-slate-100 placeholder:text-[#6B7280] dark:text-slate-400/50 outline-none"
            />
          </div>
        </div>

        <div className="mt-auto flex w-full justify-end gap-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-[188px] rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] py-2 font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            Back
          </button>
          <button
            type="button"
            disabled={assignMutation.isPending || selectedIds.length === 0}
            onClick={() => assignMutation.mutate()}
            className="w-[188px] rounded-xl bg-[#2A4467] py-2 font-semibold text-white disabled:opacity-60"
          >
            {assignMutation.isPending ? "Sending..." : "Send for Approval"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AmendmentDetailsSheet: React.FC<AmendmentDetailsSheetProps> = ({
  trigger,
  contractId,
  basePath,
  amendmentId,
  summary,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  approverPoolPath,
  renderManagerRejectedAction,
}) => {
  const [open, setOpen] = React.useState(false);
  const [acceptOpen, setAcceptOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [pendingApproverAction, setPendingApproverAction] = React.useState<
    "approved" | "rejected" | null
  >(null);
  const [approverCommentDraft, setApproverCommentDraft] = React.useState("");
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [selectedDoc, setSelectedDoc] = React.useState<DocType | null>(null);

  React.useEffect(() => {
    if (pendingApproverAction === null) setApproverCommentDraft("");
  }, [pendingApproverAction]);
  const toast = useToastHandler();
  // const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isVendor, isProjectManager, isManager, isApprover } = useUserRole();
  const isContractVendorLike = isVendor || isProjectManager;

  const detailQueryKey = useUserQueryKey([
    "contract-amendment-detail",
    contractId,
    basePath,
    amendmentId,
  ]);

  const { data: detailRes, isLoading } = useQuery<{ data?: AmendmentDetail }>({
    queryKey: detailQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: `${basePath}/${amendmentId}` });
      return res.data as { data?: AmendmentDetail };
    },
    enabled: open,
    // staleTime: 60_000,
    // retry: false,
  });

  const detail = detailRes?.data;
  const title = detail?.title || summary.amendmentTitle;
  const displayId = detail?.amendmentId || summary.amendmentId;
  const normalizedImpact = (detail?.impact ?? "").toString().toLowerCase();
  const hasApprovals = Boolean(detail?.approvers?.length);
  const hasTimeImpact = normalizedImpact.includes("time");
  const isTimeImpact = normalizedImpact === "time";
  const isCostImpact = normalizedImpact === "cost";
  const isTimeCostImpact =
    normalizedImpact === "time_cost" || normalizedImpact === "time & cost";
  const isOtherCombination =
    normalizedImpact === "others" || normalizedImpact === "other combination";
  const vendorRejected =
    (detail?.vendorStatus ?? "").toString().toLowerCase() === "rejected";
  const vendorAccepted =
    (detail?.vendorStatus ?? "").toString().toLowerCase() === "accepted" ||
    (detail?.vendorStatus ?? "").toString().toLowerCase() === "approved";
  const vendorReason =
    // prefer explicit vendor reason fields if available, otherwise fallback
    (detail as any)?.vendorReason ||
    detail?.comments ||
    (detail as any)?.rejectReason ||
    (detail as any)?.reason ||
    undefined;
  const vendorLabel = detail?.vendorStatus
    ? `${detail.vendorStatus.charAt(0).toUpperCase()}${detail.vendorStatus.slice(1)}`
    : summary.vendorStatus;
  const statusLabel = detail?.status
    ? `${detail.status.charAt(0).toUpperCase()}${detail.status.slice(1)}`
    : summary.status;
  // Once the amendment status is terminal, the approval lifecycle is over,
  // so the manager time-impact routing step (Assign Approval) no longer applies.
  const normalizedStatus = (detail?.status ?? "").toString().toLowerCase();
  const isStatusFinalized =
    normalizedStatus === "approved" || normalizedStatus === "rejected";

  const timeChange = detail?.changes?.find((c) =>
    ["time", "endDate", "newExpiryDate"].includes(c.field),
  );
  const costChange = detail?.changes?.find((c) => c.field === "cost");
  const scopeChange = detail?.changes?.find((c) =>
    ["scope", "others"].includes(c.field),
  );

  const fmtDate = (val: string | Date | undefined | null): string => {
    if (!val) return "-";
    try {
      return format(new Date(val as string), "MMM d, yyyy");
    } catch {
      return String(val);
    }
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey:
        listInvalidateQueryKey ?? ["contract-amendments", contractId, basePath],
    });
    queryClient.invalidateQueries({
      queryKey:
        statsInvalidateQueryKey ?? [
          "contract-amendments-stats",
          contractId,
          basePath,
        ],
    });
    queryClient.invalidateQueries({ queryKey: detailQueryKey });
  };

  const vendorStatusMutation = useMutation({
    mutationFn: async ({
      status,
      comments,
    }: {
      status: "accepted" | "rejected";
      comments?: string;
    }) => {
      return await patchRequest({
        url: `${basePath}/${amendmentId}/status`,
        payload: { status, comments },
      });
    },
    onSuccess: (_, { status }) => {
      toast.success(
        "Success",
        status === "accepted"
          ? "Amendment accepted successfully"
          : "Amendment rejected successfully",
      );
      invalidateAll();
      setAcceptOpen(false);
      setRejectOpen(false);
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error?.response?.data?.message ??
          error?.message ??
          "Failed to update amendment status",
      );
    },
  });

  const approverActionMutation = useMutation({
    mutationFn: async ({
      action,
      comment,
    }: {
      action: "approved" | "rejected";
      comment: string;
    }) => {
      return await postRequest({
        url: `${basePath}/${amendmentId}/approve`,
        payload: { action, comment },
      });
    },
    onSuccess: (_, { action }) => {
      toast.success(
        "Success",
        action === "approved" ? "Amendment approved" : "Amendment rejected",
      );
      invalidateAll();
      setPendingApproverAction(null);
    },
    onError: (error: any) => {
      toast.error(
        "Error",
        error?.response?.data?.message ??
          error?.message ??
          "Failed to submit approval decision",
      );
    },
  });

  const handlePreview = (doc: DocType) => {
    if (!doc.url) {
      toast.error("Preview", "File URL is missing");
      return;
    }
    setSelectedDoc(doc);
    setViewerOpen(true);
  };

  const handleDownload = (doc: DocType) => {
    if (!doc.url) {
      toast.error("Download", "File URL is missing");
      return;
    }
    const a = window.document.createElement("a");
    a.href = doc.url;
    a.download = doc.name;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl rounded-2xl overflow-y-auto [&>button]:hidden p-0"
      >
        <div className="space-y-6 p-6" data-testid="amendment-details-sheet">
          <SheetHeader className="space-y-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SheetClose asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827] dark:text-slate-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </SheetClose>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                  Amendment Details
                </SheetTitle>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F] dark:text-slate-100"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Export
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
            {isLoading ? "Loading..." : title || "-"}
          </div>

          <Tabs
            defaultValue="overview"
            className="w-full bg-transparent space-y-4"
          >
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0  justify-start bg-transparent w-full">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Overview
              </TabsTrigger>
              {/* <TabsTrigger
                value="comments"
                className="data-[state=active]:border-[#2A4467] data-[state=active]:dark:bg-transparent data-[state=active]:dark:text-slate-100 relative rounded-none py-2 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 border-0 border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none flex-none px-3"
              >
                Comments
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="overview" className="space-y-5">
              {/* Top overview grid (varies by impact) */}
              {isTimeImpact && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <LabelRow label="Amendment Name" value={title || "-"} />
                    <LabelRow label="Impact Type" value="Time" />
                    <LabelRow
                      label="New Expiry/Delivery/Completion Date"
                      value={fmtDate(timeChange?.newValue as any)}
                    />
                  </div>
                  <div className="space-y-2">
                    <LabelRow label="Amendment ID" value={displayId || "-"} />
                    <LabelRow
                      label="Prev. Expiry/Delivery/Completion Date"
                      value={fmtDate(timeChange?.oldValue as any)}
                    />
                    <LabelRow label="Vendor" value={vendorLabel || "-"} />
                    <LabelRow
                      label="Status"
                      value={<StatusPill status={statusLabel || "pending"} />}
                    />
                  </div>
                </div>
              )}

              {isCostImpact && (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <LabelRow label="Amendment Name" value={title || "-"} />
                    <LabelRow label="Impact Type" value="Cost" />
                  </div>
                  <div className="space-y-2">
                    <LabelRow label="Amendment ID" value={displayId || "-"} />
                    <LabelRow label="Value" value={costChange?.newValue ? String(costChange.newValue) : "-"} highlight />
                    <LabelRow label="Vendor" value={vendorLabel || "-"} />
                    <LabelRow
                      label="Status"
                      value={<StatusPill status={statusLabel || "pending"} />}
                    />
                  </div>
                </div>
              )}

              {isTimeCostImpact && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <LabelRow label="Amendment Name" value={title || "-"} />
                      <LabelRow label="Impact Type" value="Time & Cost" />
                    </div>
                    <div className="space-y-2">
                      <LabelRow label="Amendment ID" value={displayId || "-"} />
                      <LabelRow
                        label="Prev. Expiry/Delivery/Completion Date"
                        value={fmtDate(timeChange?.oldValue as any)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <LabelRow
                        label="New Expiry/Delivery/Completion Date"
                        value={fmtDate(timeChange?.newValue as any)}
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelRow label="Value" value={costChange?.newValue ? String(costChange.newValue) : "-"} highlight />
                      <LabelRow label="Vendor" value={vendorLabel || "-"} />
                      <LabelRow
                        label="Status"
                        value={<StatusPill status={statusLabel || "pending"} />}
                      />
                    </div>
                  </div>
                </div>
              )}

              {isOtherCombination && (
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <LabelRow label="Amendment Name" value={title || "-"} />
                      <LabelRow label="Impact Type" value="Other Combination" />
                    </div>
                    <div className="space-y-2">
                      <LabelRow label="Amendment ID" value={displayId || "-"} />
                      <LabelRow label="Scope" value={scopeChange?.newValue ? String(scopeChange.newValue) : "-"} />
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <LabelRow
                        label="Prev. Expiry/Delivery/Completion Date"
                        value={fmtDate(timeChange?.oldValue as any)}
                      />
                    </div>
                    <div className="space-y-2">
                      <LabelRow
                        label="New Expiry/Delivery/Completion Date"
                        value={fmtDate(timeChange?.newValue as any)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <LabelRow label="Value" value={costChange?.newValue ? String(costChange.newValue) : "-"} highlight />
                    <LabelRow label="Vendor" value={vendorLabel || "-"} />
                    <LabelRow
                      label="Status"
                      value={<StatusPill status={statusLabel || "pending"} />}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mb-7">
                <div className="text-sm text-[#6B7280] dark:text-slate-400">Description</div>
                <div className="text-sm text-[#374151] dark:text-slate-300">
                  {detail?.description || "-"}
                </div>
              </div>

              {vendorRejected && (
                <div className="space-y-2">
                  <div className="text-sm text-[#6B7280] dark:text-slate-400">
                    Vendor's Rejection Reason
                  </div>
                  <div className="text-sm text-[#374151] dark:text-slate-300">
                    {vendorReason || "-"}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">Attached Documents</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
                  {(detail?.files ?? []).map((f, idx) => {
                    const fileExtension = getFileExtension(
                      f.name ?? "",
                      f.type ?? "",
                    );
                    return (
                      <DocumentItem
                        d={{
                          id: f.url ?? "",
                          name: f.name ?? "",
                          icon: getFileIcon(f.type ?? ""),
                          type: fileExtension,
                          size: f.size ?? "-",
                          url: f.url,
                        }}
                        // canEdit={canEdit}
                        // navigate={navigate?.(contractId)}
                        handlePreview={handlePreview}
                        handleDownload={handleDownload}
                        key={`${f.url ?? f.name ?? "file"}-${idx}`}
                      />
                    );
                  })}
                  {(detail?.files ?? []).length === 0 && (
                    <div className="text-sm text-[#6B7280] dark:text-slate-400">No documents.</div>
                  )}
                </div>
              </div>

              {isManager &&
                !isStatusFinalized &&
                hasTimeImpact &&
                vendorAccepted &&
                !hasApprovals && (
                  <div className="flex items-start gap-3 rounded-2xl border border-[#2A44671A] bg-[#F8F8F8] p-4 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex h-8 w-10 items-center justify-center rounded-full border border-[#EF4444] text-[#EF4444]">
                      <AlertTriangle className="h-4 w-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-[#0F0F0F] dark:text-slate-100">
                        Action needed
                      </div>
                      <div className="text-sm text-[#626262] dark:text-slate-400">
                        This amendment includes a time impact, but no approver
                        has been assigned to review time-related impacts.
                      </div>
                    </div>
                  </div>
                )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] dark:border-slate-700 p-4 text-sm text-[#6B7280] dark:text-slate-400">
                No comments yet.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {isContractVendorLike && detail?.vendorStatus === "pending" && (
          <div className="sticky bottom-0 w-full border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
            <div className="flex gap-6">
              <VendorRejectDialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                isPending={vendorStatusMutation.isPending}
                onConfirm={(comments) =>
                  vendorStatusMutation.mutate({
                    status: "rejected",
                    comments,
                  })
                }
                trigger={
                  <button
                    type="button"
                    onClick={() => setRejectOpen(true)}
                    className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] h-11 text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    Reject Amendment
                  </button>
                }
              />
              <VendorAcceptDialog
                open={acceptOpen}
                onClose={() => setAcceptOpen(false)}
                isPending={vendorStatusMutation.isPending}
                onConfirm={() =>
                  vendorStatusMutation.mutate({ status: "accepted" })
                }
                trigger={
                  <button
                    type="button"
                    onClick={() => setAcceptOpen(true)}
                    className="flex-1 rounded-xl bg-[#2A4467] h-11 text-base font-semibold text-white"
                  >
                    Accept Amendment
                  </button>
                }
              />
            </div>
          </div>
        )}

        {isManager &&
          detail &&
          (vendorRejected || normalizedStatus === "rejected") &&
          renderManagerRejectedAction && (
            <div className="sticky bottom-0 w-full border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
              <div className="flex justify-end">
                {renderManagerRejectedAction({
                  detail,
                  onSubmitted: () => {
                    invalidateAll();
                  },
                  trigger: (
                    <button
                      type="button"
                      className="h-11 rounded-xl bg-[#2A4467] px-6 text-sm font-semibold text-white"
                    >
                      Modify & Resubmit
                    </button>
                  ),
                })}
              </div>
            </div>
          )}

        {isApprover && detail?.approverStatus === "pending" && (
          <div className="sticky bottom-0 w-full border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
            <div className="flex gap-6">
              <button
                type="button"
                disabled={approverActionMutation.isPending}
                onClick={() => setPendingApproverAction("rejected")}
                className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] h-11 text-base font-semibold text-[#0F0F0F] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={approverActionMutation.isPending}
                onClick={() => setPendingApproverAction("approved")}
                className="flex-1 rounded-xl bg-[#2A4467] h-11 text-base font-semibold text-white disabled:opacity-60"
              >
                Approve
              </button>
            </div>
          </div>
        )}

        <Dialog
          open={pendingApproverAction !== null}
          onOpenChange={(next) => {
            if (!next && !approverActionMutation.isPending) {
              setPendingApproverAction(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-md p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">
                {pendingApproverAction === "approved"
                  ? "Approve Amendment"
                  : "Reject Amendment"}
              </DialogTitle>
            </DialogHeader>
            <div className="px-6 pb-6 space-y-4">
              <p className="text-sm text-[#6B7280] dark:text-slate-400">
                {pendingApproverAction === "approved"
                  ? "Add an optional comment before approving this amendment."
                  : "Add an optional comment explaining why this amendment is being rejected."}
              </p>
              <textarea
                value={approverCommentDraft}
                onChange={(e) => setApproverCommentDraft(e.target.value)}
                placeholder="Enter your comment (optional)"
                rows={5}
                className="w-full resize-none rounded-lg border border-[#E5E7EB] bg-white p-3 text-sm text-[#0F0F0F] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2A4467] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                autoFocus
              />
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-[#E5E7EB] text-sm font-semibold text-[#111827] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  disabled={approverActionMutation.isPending}
                  onClick={() => setPendingApproverAction(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className={cn(
                    "h-11 flex-1 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed",
                    pendingApproverAction === "approved"
                      ? "bg-[#2A4467] hover:bg-[#1f3552]"
                      : "bg-[#E53935] hover:bg-[#C62828]",
                  )}
                  disabled={approverActionMutation.isPending}
                  aria-busy={approverActionMutation.isPending}
                  onClick={() => {
                    if (pendingApproverAction === null) return;
                    approverActionMutation.mutate({
                      action: pendingApproverAction,
                      comment: approverCommentDraft.trim(),
                    });
                  }}
                >
                  {approverActionMutation.isPending
                    ? pendingApproverAction === "approved"
                      ? "Approving..."
                      : "Rejecting..."
                    : pendingApproverAction === "approved"
                      ? "Confirm Approve"
                      : "Confirm Reject"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manager Assign Approval visibility — time-impact only.
            For cost / time_cost / others, the manager decides directly
            elsewhere; Assign Approval is the time-impact routing step
            and only appears once the vendor has accepted. Hidden once
            approvers are assigned — BE signals this with
            `assignApprover: true` even when the `approvers[]` array
            isn't populated in the response, so check both. */}
        {isManager &&
          !isStatusFinalized &&
          !detail?.assignApprover &&
          !hasApprovals &&
          isTimeImpact &&
          vendorAccepted && (
          <div className="sticky bottom-0 w-full border-t border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-950 p-6">
            <div className="flex justify-end">
              <AssignApprovalDialog
                contractId={contractId}
                basePath={basePath}
                amendmentId={amendmentId}
                onAssigned={invalidateAll}
                listInvalidateQueryKey={listInvalidateQueryKey}
                statsInvalidateQueryKey={statsInvalidateQueryKey}
                approverPoolPath={approverPoolPath}
                trigger={
                  <button
                    type="button"
                    className="h-11 px-6 rounded-xl bg-[#2A4467] text-sm font-semibold text-white"
                  >
                    Assign Approval
                  </button>
                }
              />
            </div>
          </div>
        )}

        {selectedDoc && (
          <DocumentViewer
            isOpen={viewerOpen}
            onClose={() => {
              setViewerOpen(false);
              setSelectedDoc(null);
            }}
            fileUrl={selectedDoc.url ?? ""}
            fileName={selectedDoc.name}
            fileType={selectedDoc.type}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

type Props = {
  rows?: AmendmentRow[];
  isLoading?: boolean;
  contractId: string;
  basePath: string;
  listInvalidateQueryKey?: readonly unknown[];
  statsInvalidateQueryKey?: readonly unknown[];
  approverPoolPath?: string;
  renderManagerRejectedAction?: (args: {
    detail: AmendmentDetail;
    onSubmitted: () => void;
    trigger: React.ReactElement;
  }) => React.ReactNode;
};

const AmendmentsTable: React.FC<Props> = ({
  rows = [],
  isLoading,
  contractId,
  basePath,
  listInvalidateQueryKey,
  statsInvalidateQueryKey,
  approverPoolPath,
  renderManagerRejectedAction,
}) => {
  const [search, setSearch] = React.useState("");

  const columns = React.useMemo<ColumnDef<AmendmentRow>[]>(
    () => [
      {
        accessorKey: "amendmentId",
        header: "Amendment ID",
        cell: ({ getValue }) => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151] dark:text-slate-300">
            {getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "amendmentTitle",
        header: "Amendment Title",
        cell: ({ getValue }) => (
          <div className="w-[160px] py-2 text-sm font-medium text-[#374151] dark:text-slate-300">
            {getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "vendorStatus",
        header: "Vendor Status",
        cell: ({ getValue }) => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151] dark:text-slate-300">
            {getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const s = getValue<AmendmentRow["status"]>();
          const tone =
            s === "Approved"
              ? "bg-[#43A0471A] text-[#43A047]"
              : s === "Pending"
                ? "bg-[#FACC151A] text-[#FACC15]"
                : "bg-[#E539351A] text-[#E53935]";
          return (
            <div className="flex w-[120px] items-center justify-center py-2">
              <div className={`rounded-xl px-[18px] py-[6px] ${tone}`}>
                <span className="text-xs font-semibold leading-[15px]">
                  {s}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="w-[80px] py-2 text-center">
            <AmendmentDetailsSheet
              contractId={contractId}
              basePath={basePath}
              amendmentId={row.original.id}
              summary={{
                amendmentTitle: row.original.amendmentTitle,
                amendmentId: row.original.amendmentId,
                vendorStatus: row.original.vendorStatus,
                status: row.original.status,
              }}
              listInvalidateQueryKey={listInvalidateQueryKey}
              statsInvalidateQueryKey={statsInvalidateQueryKey}
              approverPoolPath={approverPoolPath}
              renderManagerRejectedAction={renderManagerRejectedAction}
              trigger={
                <button
                  type="button"
                  className="text-sm font-bold text-[#43A047] underline"
                >
                  View
                </button>
              }
            />
          </div>
        ),
      },
    ],
    [
      contractId,
      basePath,
      listInvalidateQueryKey,
      statsInvalidateQueryKey,
      approverPoolPath,
    ],
  );

  const filteredRows = React.useMemo(() => {
    if (!search) return rows;
    const query = search.toLowerCase();
    return rows.filter((row) =>
      [row.amendmentId, row.amendmentTitle, row.vendorStatus, row.status].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [rows, search]);

  return (
    <div
      data-testid="amendments-table"
      className="rounded-xl border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
    >
      <div className="flex items-center gap-6 border-b border-[#E9E9EB] dark:border-slate-800 px-6 py-6">
        <div className="text-base font-semibold text-[#0F0F0F] dark:text-slate-100">Amendments</div>
        <div className="relative w-[300px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B] dark:text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-12 w-[300px] rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] dark:text-slate-100 placeholder:text-[#6B6B6B] dark:text-slate-400"
          />
        </div>
      </div>

      <div className="px-0 pb-0">
        <DataTable<AmendmentRow>
          data={filteredRows}
          columns={columns}
          options={{
            disableSelection: true,
            isLoading,
            disablePagination: true,
            manualPagination: false,
            totalCounts: filteredRows.length,
            setPagination: () => {},
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          classNames={{
            container: "border border-[#E5E7EB] dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900",
            tHeader: "bg-[#F9FAFB] dark:bg-slate-800",
            tHeadRow: "border-b border-[#E5E7EB] dark:border-slate-800",
            tBody: "bg-white dark:bg-slate-900",
            tRow: "border-b border-[#E5E7EB] dark:border-slate-800",
            tHead: "px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400",
            tCell: "px- py-4 text-sm text-slate-700 dark:text-slate-300 align-top",
          }}
        />
      </div>
    </div>
  );
};

export default AmendmentsTable;
