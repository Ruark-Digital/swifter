import React from "react";
import { DataTable } from "@/components/layouts/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
  Eye,
  Download,
  Search,
  Share2,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRequest, patchRequest, postRequest } from "@/lib/axiosInstance";
import { useToastHandler } from "@/hooks/useToaster";
import { useUserRole } from "@/hooks/useUserRole";

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
  summary: Pick<AmendmentRow, "amendmentTitle" | "amendmentId" | "vendorStatus" | "status">;
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
  <div className="grid grid-cols-2 gap-3 py-2">
    <span className="text-sm text-[#6B7280]">{label}</span>
    <span
      className={`text-sm ${
        highlight ? "font-semibold text-[#0F0F0F]" : "text-[#111827]"
      }`}
    >
      {value}
    </span>
  </div>
);

const DocCard = ({
  name,
  type,
  size,
}: {
  name: string;
  type: string;
  size: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6] text-xs font-semibold text-[#374151]">
      {type}
    </div>
    <div className="flex-1">
      <div className="text-sm font-medium text-[#0F0F0F]">{name}</div>
      <div className="text-xs text-[#6B7280]">
        {type} • {size}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280]"
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  </div>
);

type AmendmentDetail = {
  title?: string;
  amendmentId?: string;
  impact?: string;
  description?: string;
  vendorStatus?: string;
  status?: string;
  files?: Array<{ name?: string; type?: string; size?: string; url?: string }>;
};

type PersonnelRole = { _id: string; name: string; __v?: number };
type PersonnelUser = {
  _id: string;
  email: string;
  role: PersonnelRole[];
  firstName?: string;
  lastName?: string;
};

type PersonnelApiResponse = { status: number; message: string; data: PersonnelUser[] };

const formatRoleLabel = (roles: PersonnelRole[] | undefined) => {
  const role = roles?.find((r) => r.name !== "approver")?.name ?? roles?.[0]?.name;
  if (!role) return "—";
  const parts = role.split(/[_\s-]+/g).filter(Boolean);
  return parts.map((p) => `${p.charAt(0).toUpperCase()}${p.slice(1)}`).join(" ");
};

const normalizeFileType = (value?: string) => {
  const s = value?.toLowerCase() ?? "";
  if (s.includes("pdf")) return "PDF";
  if (s.includes("doc")) return "DOC";
  if (s.includes("xls")) return "XLS";
  if (s.includes("zip")) return "ZIP";
  if (s.includes("png")) return "PNG";
  if (s.includes("jpeg") || s.includes("jpg")) return "JPG";
  return value ? value.toUpperCase() : "—";
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
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>
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
      <DialogContent className="w-[498px] h-[260px] p-8 rounded-2xl border-0 flex flex-col items-center justify-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#E53935] text-[#E53935]">
          <X className="h-8 w-8" />
        </div>
        <div className="text-center text-xl font-semibold text-[#0F0F0F]">
          Submission Accepted!
        </div>
        <div className="flex w-full gap-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] py-[14px] text-base font-semibold text-[#0F0F0F]"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-[#2A4467] py-[15px] text-base font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Processing..." : "View Details"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VendorRejectDialog: React.FC<{
  trigger: React.ReactNode;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  open: boolean;
}> = ({ trigger, onConfirm, onClose, open, isPending }) => {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[700px] h-[380px] p-8 rounded-2xl border-0 flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div className="text-xl font-semibold text-[#0F0F0F]">Reject Review</div>
          <button type="button" onClick={onClose} className="text-[#E53935]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-[#3D3D3D]">
            Why are you rejecting this deliverable?
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Duration"
            className="h-[120px] w-full resize-none rounded-lg border border-[#E5E7EB] p-4 text-sm text-[#0F0F0F] placeholder:text-[#6B7280]/50"
          />
        </div>

        <div className="mt-auto flex w-full justify-end gap-6">
          <button
            type="button"
            onClick={onClose}
            className="w-[306px] rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] py-[14px] text-base font-semibold text-[#0F0F0F]"
          >
            Back
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="w-[306px] rounded-xl bg-[#E53935] py-[15px] text-base font-semibold text-white disabled:opacity-60"
          >
            {isPending ? "Rejecting..." : "Reject Review"}
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
}> = ({ trigger, contractId, basePath, amendmentId, onAssigned }) => {
  const [open, setOpen] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const toast = useToastHandler();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PersonnelApiResponse>({
    queryKey: ["contract-personnel"],
    queryFn: async () => {
      const res = await getRequest({ url: "/contract/manager/personnel" });
      return res.data as PersonnelApiResponse;
    },
    enabled: open,
    staleTime: 60_000,
    retry: false,
  });

  const personnel = React.useMemo(() => {
    const list =
      data?.data?.filter((p) => p.role?.some((r) => r.name === "approver")) ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((p) => {
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      return (
        name.toLowerCase().includes(q) ||
        (p.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [data?.data, search]);

  const toggleAssigned = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const assignedUsers = React.useMemo(() => {
    const byId = new Map((data?.data ?? []).map((p) => [p._id, p]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as PersonnelUser[];
  }, [data?.data, selectedIds]);

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
        queryKey: ["contract-amendments", contractId, basePath],
      });
      queryClient.invalidateQueries({
        queryKey: ["contract-amendments-stats", contractId, basePath],
      });
      onAssigned();
      setOpen(false);
      setSelectedIds([]);
      setSelectedGroup("");
      setSearch("");
    },
    onError: (error: any) => {
      toast.error("Error", error?.message || "Failed to assign approvers");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[864px] h-[724px] p-8 rounded-2xl border-0 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="text-xl font-semibold text-[#0F0F0F]">Send for Approval</div>
          <button type="button" onClick={() => setOpen(false)} className="text-[#E53935]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-3 w-full">
          <div className="text-sm font-medium text-[#0F0F0F]">Select Approvers Group</div>
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="h-12 w-full rounded-lg border border-[#E5E7EB] px-4 text-sm">
              <SelectValue placeholder="Select Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="group-1">Group 1 - Approval Level</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col rounded-xl border border-[#E5E7EB] overflow-hidden w-[800px]">
          <div className="flex items-center justify-between bg-[#F9FAFB] px-6 py-4 border-b border-[#E5E7EB]">
            <div className="w-[150px] text-sm font-semibold text-[#2A4467]">Group</div>
            <div className="w-[150px] text-center text-sm font-semibold text-[#2A4467]">Role</div>
            <div className="w-[121px] text-center text-sm font-semibold text-[#2A4467]">Action</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-sm text-[#6B7280]">Loading...</div>
            ) : personnel.length === 0 ? (
              <div className="p-6 text-sm text-[#6B7280]">No personnel found.</div>
            ) : (
              <div className="flex flex-col gap-3 py-3">
                {personnel.map((p) => {
                  const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
                  const assigned = selectedIds.includes(p._id);
                  return (
                    <div key={p._id} className="flex items-start justify-between px-6">
                      <div className="w-[150px] py-2">
                        <div className="text-sm font-semibold text-[#374151]">{name}</div>
                        <a className="text-xs text-[#286EE0] underline" href={`mailto:${p.email}`}>
                          {p.email}
                        </a>
                      </div>
                      <div className="w-[150px] py-2 text-center text-sm font-medium text-[#374151]">
                        {formatRoleLabel(p.role)}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleAssigned(p._id)}
                        className="w-[121px] py-2 flex items-center justify-center gap-2"
                      >
                        {assigned ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#00A859]">
                            <Check className="h-4 w-4 text-white" />
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#DDDDDD]" />
                        )}
                        <span className="text-sm font-medium text-[#353535]">Assign</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 w-full">
          <div className="text-sm font-medium text-[#0F0F0F]">Assigned Approvers</div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F3F4F6] px-4 py-4">
            {assignedUsers.map((p) => {
              const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
              return (
                <div key={p._id} className="inline-flex items-center gap-2 rounded-lg bg-[#2A44671A] px-2 py-1">
                  <span className="text-xs font-semibold text-[#2A4467]">{name}</span>
                  <button type="button" onClick={() => toggleAssigned(p._id)} className="text-[#E53935]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="flex-1 bg-transparent text-sm text-[#0F0F0F] placeholder:text-[#6B7280]/50 outline-none"
            />
          </div>
        </div>

        <div className="mt-auto flex w-full justify-end gap-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-[188px] rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] py-[14px] text-base font-semibold text-[#0F0F0F]"
          >
            Back
          </button>
          <button
            type="button"
            disabled={assignMutation.isPending || selectedIds.length === 0}
            onClick={() => assignMutation.mutate()}
            className="w-[188px] rounded-xl bg-[#2A4467] py-[15px] text-base font-semibold text-white disabled:opacity-60"
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
}) => {
  const [open, setOpen] = React.useState(false);
  const [acceptOpen, setAcceptOpen] = React.useState(false);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const toast = useToastHandler();
  const queryClient = useQueryClient();
  const { isVendor, isManager } = useUserRole();

  const detailQueryKey = ["contract-amendment-detail", contractId, basePath, amendmentId];

  const { data: detailRes, isLoading } = useQuery<{ data?: AmendmentDetail }>({
    queryKey: detailQueryKey,
    queryFn: async () => {
      const res = await getRequest({ url: `${basePath}/${amendmentId}` });
      return res.data as { data?: AmendmentDetail };
    },
    enabled: open,
    staleTime: 60_000,
    retry: false,
  });

  const detail = detailRes?.data;
  const title = detail?.title || summary.amendmentTitle;
  const displayId = detail?.amendmentId || summary.amendmentId;
  const vendorLabel = detail?.vendorStatus
    ? `${detail.vendorStatus.charAt(0).toUpperCase()}${detail.vendorStatus.slice(1)}`
    : summary.vendorStatus;
  const statusLabel = detail?.status
    ? `${detail.status.charAt(0).toUpperCase()}${detail.status.slice(1)}`
    : summary.status;

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: ["contract-amendments", contractId, basePath],
    });
    queryClient.invalidateQueries({
      queryKey: ["contract-amendments-stats", contractId, basePath],
    });
    queryClient.invalidateQueries({ queryKey: detailQueryKey });
  };

  const vendorStatusMutation = useMutation({
    mutationFn: async (status: "accepted" | "rejected") => {
      return await patchRequest({
        url: `${basePath}/${amendmentId}/status`,
        payload: { status },
      });
    },
    onSuccess: (_, status) => {
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
      toast.error("Error", error?.message || "Failed to update amendment status");
    },
  });

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
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E5E7EB] text-[#111827]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </SheetClose>
                <SheetTitle className="text-base font-semibold text-[#0F0F0F]">
                  Amendment Details
                </SheetTitle>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="h-9 rounded-lg border-[#E5E7EB] px-3 text-xs font-semibold text-[#0F0F0F]"
                >
                  <Share2 className="mr-2 h-4 w-4" /> Export
                </Button>
                <SheetClose asChild>
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FCA5A5] text-[#EF4444]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </SheetClose>
              </div>
            </div>
          </SheetHeader>

          <div className="text-base font-semibold text-[#0F0F0F]">
            {isLoading ? "Loading..." : title || "—"}
          </div>

          <Tabs defaultValue="overview" className="w-full bg-transparent space-y-4">
            <TabsList className="h-auto rounded-none border-b border-gray-300 dark:border-gray-600 dark:bg-transparent p-0  justify-start bg-transparent w-full">
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

            <TabsContent value="overview" className="space-y-5">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <LabelRow
                    label="Amendment Name"
                    value={title || "—"}
                  />
                  <LabelRow label="Impact Type" value={detail?.impact ?? "—"} />
                  <LabelRow label="Time" value="—" />
                  <LabelRow
                    label="New Expiry/Delivery/Completion Date"
                    value="—"
                  />
                </div>
                <div>
                  <LabelRow label="Amendment ID" value={displayId || "—"} />
                  <LabelRow label="Value" value="—" highlight />
                  <LabelRow label="Vendor" value={vendorLabel || "—"} />
                  <LabelRow
                    label="Status"
                    value={
                      <StatusPill status={statusLabel || "pending"} />
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-[#6B7280]">Description</div>
                <div className="text-sm text-[#374151]">
                  {detail?.description || "—"}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-[#6B7280]">Attached Documents</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(detail?.files ?? []).map((f, idx) => (
                    <DocCard
                      key={`${f.url ?? f.name ?? "file"}-${idx}`}
                      name={f.name ?? "Document"}
                      type={normalizeFileType(f.type)}
                      size={f.size ?? "—"}
                    />
                  ))}
                  {(detail?.files ?? []).length === 0 && (
                    <div className="text-sm text-[#6B7280]">No documents.</div>
                  )}
                </div>
              </div>

              {isManager && (
                <>
                  <div className="flex items-start gap-3 rounded-2xl border border-[#2A44671A] bg-[#F8F8F8] p-4">
                    <div className="flex h-8 w-10 items-center justify-center rounded-full border border-[#EF4444] text-[#EF4444]">
                      <AlertTriangle className="h-4 w-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-[#0F0F0F]">
                        Action needed
                      </div>
                      <div className="text-sm text-[#626262]">
                        This amendment includes a time impact, but no approver has
                        been assigned to review time-related impacts.
                      </div>
                    </div>
                  </div>

                  <AssignApprovalDialog
                    contractId={contractId}
                    basePath={basePath}
                    amendmentId={amendmentId}
                    onAssigned={invalidateAll}
                    trigger={
                      <button
                        type="button"
                        className="h-11 w-full rounded-xl bg-[#2A4467] text-sm font-semibold text-white"
                      >
                        Assign Approval
                      </button>
                    }
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-4">
              <div className="rounded-xl border border-[#E5E7EB] p-4 text-sm text-[#6B7280]">
                No comments yet.
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {isVendor && (
          <div className="sticky bottom-0 w-full border-t border-[#E5E7EB] bg-white p-6">
            <div className="flex gap-6">
              <VendorRejectDialog
                open={rejectOpen}
                onClose={() => setRejectOpen(false)}
                isPending={vendorStatusMutation.isPending}
                onConfirm={() => vendorStatusMutation.mutate("rejected")}
                trigger={
                  <button
                    type="button"
                    onClick={() => setRejectOpen(true)}
                    className="flex-1 rounded-xl border border-[#E5E7EB] bg-[#F3F4F6] py-[14px] text-base font-semibold text-[#0F0F0F]"
                  >
                    Reject Amendment
                  </button>
                }
              />
              <VendorAcceptDialog
                open={acceptOpen}
                onClose={() => setAcceptOpen(false)}
                isPending={vendorStatusMutation.isPending}
                onConfirm={() => vendorStatusMutation.mutate("accepted")}
                trigger={
                  <button
                    type="button"
                    onClick={() => setAcceptOpen(true)}
                    className="flex-1 rounded-xl bg-[#2A4467] py-[15px] text-base font-semibold text-white"
                  >
                    Accept Amendment
                  </button>
                }
              />
            </div>
          </div>
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
};

const AmendmentsTable: React.FC<Props> = ({
  rows = [],
  isLoading,
  contractId,
  basePath,
}) => {
  const [search, setSearch] = React.useState("");

  const columns = React.useMemo<ColumnDef<AmendmentRow>[]>(
    () => [
      {
        accessorKey: "amendmentId",
        header: "Amendment ID",
        cell: ({ getValue }) => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151]">
            {getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "amendmentTitle",
        header: "Amendment Title",
        cell: ({ getValue }) => (
          <div className="w-[160px] py-2 text-sm font-medium text-[#374151]">
            {getValue<string>()}
          </div>
        ),
      },
      {
        accessorKey: "vendorStatus",
        header: "Vendor Status",
        cell: ({ getValue }) => (
          <div className="w-[100px] py-2 text-center text-sm font-semibold text-[#374151]">
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
                <span className="text-xs font-semibold leading-[15px]">{s}</span>
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
    [contractId, basePath],
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
      className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden"
    >
      <div className="flex items-center gap-6 border-b border-[#E9E9EB] px-6 py-6">
        <div className="text-base font-semibold text-[#0F0F0F]">Amendments</div>
        <div className="relative w-[300px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#6B6B6B]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="h-12 w-[300px] rounded-lg border border-[#E5E7EB] pl-9 text-sm text-[#0F0F0F] placeholder:text-[#6B6B6B]"
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
            container: "border border-[#E5E7EB] rounded-xl bg-white",
            tHeader: "bg-[#F9FAFB]",
            tHeadRow: "border-b border-[#E5E7EB]",
            tBody: "bg-white",
            tRow: "border-b border-[#E5E7EB]",
            tHead: "px-6 py-3 text-xs font-semibold text-slate-500",
            tCell: "px- py-4 text-sm text-slate-700 align-top",
          }}
        />
      </div>
    </div>
  );
};

export default AmendmentsTable;
